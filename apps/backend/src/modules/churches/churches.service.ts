import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { AuditLogService } from '../audit/audit-log.service';
import { RoleEntity } from '../rbac/entities/role.entity';
import { RbacService } from '../rbac/rbac.service';
import { CHURCH_ROLE_CODES, SYSTEM_PERMISSION_CODES } from '../rbac/rbac.constants';
import { UserEntity } from '../users/entities/user.entity';

import { CHURCH_AUDIT_ACTIONS } from './constants/audit-actions';
import { AddChurchMemberDto } from './dto/add-church-member.dto';
import { ChurchMemberResponseDto } from './dto/member-response.dto';
import { ChurchResponseDto } from './dto/church-response.dto';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';
import { UpdateChurchMemberRoleDto } from './dto/update-church-member-role.dto';
import { ChurchMemberEntity } from './entities/church-member.entity';
import { ChurchEntity } from './entities/church.entity';
import { ChurchRequestMeta } from './types/church-request-meta.type';

const ASSIGNABLE_NON_OWNER_ROLES: string[] = [
  CHURCH_ROLE_CODES.CHURCH_ADMIN,
  CHURCH_ROLE_CODES.MEMBER,
];

@Injectable()
export class ChurchesService {
  constructor(
    @InjectRepository(ChurchEntity)
    private readonly churchRepo: Repository<ChurchEntity>,
    @InjectRepository(ChurchMemberEntity)
    private readonly churchMemberRepo: Repository<ChurchMemberEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly rbacService: RbacService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listMyChurches(userId: string): Promise<ChurchResponseDto[]> {
    const rows = await this.churchRepo
      .createQueryBuilder('c')
      .distinct(true)
      .innerJoin(
        ChurchMemberEntity,
        'cm',
        'cm.church_id = c.id AND cm.user_id = :userId AND cm.deleted_at IS NULL',
        { userId },
      )
      .where('c.deleted_at IS NULL')
      .orderBy('c.created_at', 'DESC')
      .getMany();

    return rows.map((c) => ChurchResponseDto.fromEntity(c));
  }

  async findOne(actorUserId: string, churchId: string): Promise<ChurchResponseDto> {
    await this.assertChurchPermission(actorUserId, churchId, [SYSTEM_PERMISSION_CODES.CHURCH_READ]);
    const church = await this.getActiveChurchOrThrow(churchId);
    return ChurchResponseDto.fromEntity(church);
  }

  async createChurch(
    actorUserId: string,
    dto: CreateChurchDto,
    meta?: ChurchRequestMeta,
  ): Promise<ChurchResponseDto> {
    const baseSlug = dto.slug ?? this.slugify(dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const adminRole = await this.roleRepo.findOne({
      where: { code: CHURCH_ROLE_CODES.CHURCH_ADMIN, deletedAt: IsNull() },
      select: { id: true },
    });
    if (!adminRole) {
      throw new BadRequestException('church_admin role is not configured');
    }

    const queryRunner = this.churchRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const church = queryRunner.manager.create(ChurchEntity, {
        name: dto.name,
        slug,
        ownerUserId: actorUserId,
        deletedAt: null,
      });
      const saved = await queryRunner.manager.save(church);

      await queryRunner.manager.save(
        queryRunner.manager.create(ChurchMemberEntity, {
          churchId: saved.id,
          userId: actorUserId,
          roleId: adminRole.id,
          assignedBy: actorUserId,
          deletedAt: null,
        }),
      );

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        actorUserId,
        actorType: 'user',
        action: CHURCH_AUDIT_ACTIONS.RECORD_CREATE,
        resourceType: 'church',
        resourceId: saved.id,
        scopeChurchId: saved.id,
        requestId: meta?.requestId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        beforeData: null,
        afterData: { name: saved.name, slug: saved.slug, ownerUserId: saved.ownerUserId },
      });

      return ChurchResponseDto.fromEntity(saved);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async updateChurch(
    actorUserId: string,
    churchId: string,
    dto: UpdateChurchDto,
    meta?: ChurchRequestMeta,
  ): Promise<ChurchResponseDto> {
    if (dto.name === undefined && dto.slug === undefined) {
      throw new BadRequestException('No changes provided');
    }

    await this.assertChurchPermission(actorUserId, churchId, [SYSTEM_PERMISSION_CODES.CHURCH_UPDATE]);
    const church = await this.getActiveChurchOrThrow(churchId);

    const before = { name: church.name, slug: church.slug };

    if (dto.name !== undefined) {
      church.name = dto.name;
    }
    if (dto.slug !== undefined) {
      const next = await this.ensureUniqueSlug(dto.slug, church.id);
      church.slug = next;
    }

    const saved = await this.churchRepo.save(church);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: CHURCH_AUDIT_ACTIONS.RECORD_UPDATE,
      resourceType: 'church',
      resourceId: saved.id,
      scopeChurchId: saved.id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: { name: saved.name, slug: saved.slug },
    });

    return ChurchResponseDto.fromEntity(saved);
  }

  async softDeleteChurch(actorUserId: string, churchId: string, meta?: ChurchRequestMeta): Promise<void> {
    await this.assertChurchPermission(actorUserId, churchId, [SYSTEM_PERMISSION_CODES.CHURCH_DELETE]);
    const church = await this.getActiveChurchOrThrow(churchId);

    const before = { name: church.name, slug: church.slug, ownerUserId: church.ownerUserId };

    church.deletedAt = new Date();
    await this.churchRepo.save(church);

    await this.churchMemberRepo
      .createQueryBuilder()
      .update(ChurchMemberEntity)
      .set({ deletedAt: () => 'NOW()' })
      .where('church_id = :churchId', { churchId })
      .andWhere('deleted_at IS NULL')
      .execute();

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: CHURCH_AUDIT_ACTIONS.RECORD_DELETE,
      resourceType: 'church',
      resourceId: churchId,
      scopeChurchId: churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: { deleted: true },
    });
  }

  async listMembers(actorUserId: string, churchId: string): Promise<ChurchMemberResponseDto[]> {
    await this.assertChurchPermission(actorUserId, churchId, [SYSTEM_PERMISSION_CODES.CHURCH_READ]);
    await this.getActiveChurchOrThrow(churchId);

    const rows = await this.churchMemberRepo.find({
      where: {
        churchId,
        deletedAt: IsNull(),
      },
      relations: { user: true, role: true },
      order: { createdAt: 'ASC' },
    });

    return rows.map((ur) => {
      const m = new ChurchMemberResponseDto();
      m.userId = ur.userId;
      m.roleCode = ur.role.code;
      m.displayName = ur.user.displayName;
      m.email = ur.user.email;
      return m;
    });
  }

  async addMember(
    actorUserId: string,
    churchId: string,
    dto: AddChurchMemberDto,
    meta?: ChurchRequestMeta,
  ): Promise<ChurchMemberResponseDto> {
    await this.assertChurchPermission(actorUserId, churchId, [SYSTEM_PERMISSION_CODES.CHURCH_MEMBER_MANAGE]);
    const church = await this.getActiveChurchOrThrow(churchId);

    this.assertAssignableRole(dto.roleCode);

    const target = await this.userRepo.findOne({
      where: { id: dto.userId, deletedAt: IsNull() },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const role = await this.getChurchScopedRoleOrThrow(dto.roleCode);

    const existing = await this.churchMemberRepo.findOne({
      where: {
        userId: dto.userId,
        churchId,
        deletedAt: IsNull(),
      },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this church');
    }

    const row = await this.churchMemberRepo.save(
      this.churchMemberRepo.create({
        churchId,
        userId: dto.userId,
        roleId: role.id,
        assignedBy: actorUserId,
        deletedAt: null,
      }),
    );

    const withRelations = await this.churchMemberRepo.findOneOrFail({
      where: { id: row.id },
      relations: { user: true, role: true },
    });

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: CHURCH_AUDIT_ACTIONS.MEMBER_ADD,
      resourceType: 'church_membership',
      resourceId: withRelations.id,
      scopeChurchId: churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: null,
      afterData: { memberUserId: dto.userId, roleCode: dto.roleCode, churchName: church.name },
    });

    const m = new ChurchMemberResponseDto();
    m.userId = withRelations.userId;
    m.roleCode = withRelations.role.code;
    m.displayName = withRelations.user.displayName;
    m.email = withRelations.user.email;
    return m;
  }

  async updateMemberRole(
    actorUserId: string,
    churchId: string,
    targetUserId: string,
    dto: UpdateChurchMemberRoleDto,
    meta?: ChurchRequestMeta,
  ): Promise<ChurchMemberResponseDto> {
    await this.assertChurchPermission(actorUserId, churchId, [SYSTEM_PERMISSION_CODES.CHURCH_ROLE_ASSIGN]);
    const church = await this.getActiveChurchOrThrow(churchId);

    this.assertAssignableRole(dto.roleCode);

    const membership = await this.churchMemberRepo.findOne({
      where: {
        userId: targetUserId,
        churchId,
        deletedAt: IsNull(),
      },
      relations: { role: true, user: true },
    });
    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    const newRole = await this.getChurchScopedRoleOrThrow(dto.roleCode);

    const beforeRole = membership.role.code;
    membership.roleId = newRole.id;
    membership.assignedBy = actorUserId;
    const saved = await this.churchMemberRepo.save(membership);

    const withRelations = await this.churchMemberRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { user: true, role: true },
    });

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: CHURCH_AUDIT_ACTIONS.MEMBER_ROLE_CHANGE,
      resourceType: 'church_membership',
      resourceId: saved.id,
      scopeChurchId: churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: { memberUserId: targetUserId, roleCode: beforeRole },
      afterData: { memberUserId: targetUserId, roleCode: dto.roleCode, churchName: church.name },
    });

    const m = new ChurchMemberResponseDto();
    m.userId = withRelations.userId;
    m.roleCode = withRelations.role.code;
    m.displayName = withRelations.user.displayName;
    m.email = withRelations.user.email;
    return m;
  }

  async removeMember(
    actorUserId: string,
    churchId: string,
    targetUserId: string,
    meta?: ChurchRequestMeta,
  ): Promise<void> {
    await this.assertChurchPermission(actorUserId, churchId, [SYSTEM_PERMISSION_CODES.CHURCH_MEMBER_MANAGE]);
    const church = await this.getActiveChurchOrThrow(churchId);

    const membership = await this.churchMemberRepo.findOne({
      where: {
        userId: targetUserId,
        churchId,
        deletedAt: IsNull(),
      },
      relations: { role: true },
    });
    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (church.ownerUserId === targetUserId) {
      throw new BadRequestException('Cannot remove the church creator from membership');
    }

    const before = { memberUserId: targetUserId, roleCode: membership.role.code };

    membership.deletedAt = new Date();
    await this.churchMemberRepo.save(membership);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: CHURCH_AUDIT_ACTIONS.MEMBER_REMOVE,
      resourceType: 'church_membership',
      resourceId: membership.id,
      scopeChurchId: churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: { removed: true, churchName: church.name },
    });
  }

  private async assertChurchPermission(userId: string, churchId: string, codes: string[]): Promise<void> {
    const ok = await this.rbacService.userHasAllPermissions(userId, codes, churchId);
    if (!ok) {
      throw new NotFoundException('Church not found');
    }
  }

  private async getActiveChurchOrThrow(churchId: string): Promise<ChurchEntity> {
    const church = await this.churchRepo.findOne({
      where: { id: churchId, deletedAt: IsNull() },
    });
    if (!church) {
      throw new NotFoundException('Church not found');
    }
    return church;
  }

  private assertAssignableRole(roleCode: string): void {
    if (!ASSIGNABLE_NON_OWNER_ROLES.includes(roleCode)) {
      throw new BadRequestException('Invalid role for church membership');
    }
  }

  private async getChurchScopedRoleOrThrow(code: string): Promise<RoleEntity> {
    const role = await this.roleRepo.findOne({
      where: { code, deletedAt: IsNull(), roleScope: 'church' },
    });
    if (!role) {
      throw new BadRequestException('Unknown role');
    }
    return role;
  }

  private slugify(name: string): string {
    const base = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
    return base.length > 0 ? base : 'church';
  }

  private async ensureUniqueSlug(desired: string, excludeChurchId?: string): Promise<string> {
    let candidate = desired.slice(0, 120);
    for (let i = 0; i < 20; i += 1) {
      const existing = await this.churchRepo.findOne({
        where: {
          slug: candidate,
          deletedAt: IsNull(),
          ...(excludeChurchId ? { id: Not(excludeChurchId) } : {}),
        },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
      const suffix = `${Date.now().toString(36)}${i}`.slice(-6);
      candidate = `${desired.slice(0, 110)}-${suffix}`.slice(0, 120);
    }
    throw new ConflictException('Could not allocate a unique slug');
  }
}
