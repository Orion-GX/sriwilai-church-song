import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsNull, Not, Repository } from 'typeorm';

import { AppConfiguration } from '../../config/configuration';
import { AuditLogService } from '../audit/audit-log.service';
import { RefreshSessionEntity } from '../auth/entities/refresh-session.entity';
import { RbacService } from '../rbac/rbac.service';

import { USER_AUDIT_ACTIONS } from './constants/audit-actions';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserEntity } from './entities/user.entity';
import { UserRequestMeta } from './types/user-request-meta.type';

export interface PaginatedUsersDto {
  items: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RefreshSessionEntity)
    private readonly refreshRepo: Repository<RefreshSessionEntity>,
    private readonly configService: ConfigService<AppConfiguration, true>,
    private readonly auditLogService: AuditLogService,
    private readonly rbacService: RbacService,
  ) {}

  async getProfile(userId: string): Promise<UserResponseDto> {
    const row = await this.userRepo.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!row) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.fromEntity(row);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    meta?: UserRequestMeta,
  ): Promise<UserResponseDto> {
    if (dto.displayName === undefined && dto.newPassword === undefined) {
      throw new BadRequestException('No changes provided');
    }
    if (dto.newPassword !== undefined && !dto.currentPassword) {
      throw new BadRequestException('currentPassword is required when changing password');
    }

    const row = await this.userRepo.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!row) {
      throw new NotFoundException('User not found');
    }

    const before = this.snapshotPublic(row);

    if (dto.newPassword !== undefined) {
      const ok = await bcrypt.compare(dto.currentPassword!, row.passwordHash);
      if (!ok) {
        throw new BadRequestException('Current password is incorrect');
      }
      const rounds = this.configService.get('auth', { infer: true }).bcryptSaltRounds;
      row.passwordHash = await bcrypt.hash(dto.newPassword, rounds);
    }

    if (dto.displayName !== undefined) {
      row.displayName = dto.displayName;
    }

    const saved = await this.userRepo.save(row);

    await this.auditLogService.log({
      actorUserId: userId,
      actorType: 'user',
      action: USER_AUDIT_ACTIONS.PROFILE_UPDATE_SELF,
      resourceType: 'user',
      resourceId: userId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: {
        ...this.snapshotPublic(saved),
        password_changed: dto.newPassword !== undefined,
      },
    });

    return UserResponseDto.fromEntity(saved);
  }

  async listUsers(query: ListUsersQueryDto): Promise<PaginatedUsersDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.userRepo.findAndCount({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: rows.map((r) => UserResponseDto.fromEntity(r)),
      total,
      page,
      limit,
    };
  }

  async findOneForAdmin(id: string): Promise<UserResponseDto> {
    const row = await this.userRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!row) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.fromEntity(row);
  }

  async createUserAsAdmin(
    dto: AdminCreateUserDto,
    actorUserId: string,
    meta?: UserRequestMeta,
  ): Promise<UserResponseDto> {
    await this.assertEmailAvailable(dto.email);

    const rounds = this.configService.get('auth', { infer: true }).bcryptSaltRounds;
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const row = this.userRepo.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      status: dto.status ?? 'active',
      emailVerifiedAt: null,
      lastLoginAt: null,
      deletedAt: null,
    });
    const saved = await this.userRepo.save(row);
    await this.rbacService.ensureDefaultPersonalUserRole(saved.id);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: USER_AUDIT_ACTIONS.ADMIN_CREATE,
      resourceType: 'user',
      resourceId: saved.id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: null,
      afterData: this.snapshotPublic(saved),
    });

    return UserResponseDto.fromEntity(saved);
  }

  async updateUserAsAdmin(
    id: string,
    dto: AdminUpdateUserDto,
    actorUserId: string,
    meta?: UserRequestMeta,
  ): Promise<UserResponseDto> {
    if (
      dto.email === undefined &&
      dto.displayName === undefined &&
      dto.status === undefined &&
      dto.password === undefined
    ) {
      throw new BadRequestException('No changes provided');
    }

    const row = await this.userRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!row) {
      throw new NotFoundException('User not found');
    }

    if (dto.email !== undefined && dto.email !== row.email) {
      await this.assertEmailAvailable(dto.email, row.id);
    }

    const before = this.snapshotPublic(row);

    if (dto.email !== undefined) {
      row.email = dto.email;
    }
    if (dto.displayName !== undefined) {
      row.displayName = dto.displayName;
    }
    if (dto.status !== undefined) {
      row.status = dto.status;
    }
    if (dto.password !== undefined) {
      const rounds = this.configService.get('auth', { infer: true }).bcryptSaltRounds;
      row.passwordHash = await bcrypt.hash(dto.password, rounds);
    }

    const saved = await this.userRepo.save(row);

    const after = {
      ...this.snapshotPublic(saved),
      password_reset: dto.password !== undefined,
    };

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: USER_AUDIT_ACTIONS.ADMIN_UPDATE,
      resourceType: 'user',
      resourceId: saved.id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: after,
    });

    return UserResponseDto.fromEntity(saved);
  }

  async softDeleteUserAsAdmin(
    id: string,
    actorUserId: string,
    meta?: UserRequestMeta,
  ): Promise<void> {
    if (id === actorUserId) {
      throw new BadRequestException('Cannot delete your own account via this endpoint');
    }

    const row = await this.userRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!row) {
      throw new NotFoundException('User not found');
    }

    const before = this.snapshotPublic(row);

    await this.refreshRepo
      .createQueryBuilder()
      .update(RefreshSessionEntity)
      .set({
        revokedAt: () => 'NOW()',
        revokeReason: 'user_deleted',
      })
      .where('user_id = :userId', { userId: id })
      .andWhere('revoked_at IS NULL')
      .execute();

    row.deletedAt = new Date();
    await this.userRepo.save(row);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: USER_AUDIT_ACTIONS.ADMIN_DELETE,
      resourceType: 'user',
      resourceId: id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: { deleted: true },
    });
  }

  private snapshotPublic(row: UserEntity): Record<string, unknown> {
    return {
      email: row.email,
      displayName: row.displayName,
      status: row.status,
      emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    };
  }

  private async assertEmailAvailable(email: string, excludeUserId?: string): Promise<void> {
    const existing = await this.userRepo.findOne({
      where: {
        email,
        deletedAt: IsNull(),
        ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
  }
}
