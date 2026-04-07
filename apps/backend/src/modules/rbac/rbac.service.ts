import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ChurchMemberEntity } from '../churches/entities/church-member.entity';

import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { SYSTEM_ROLE_CODES } from './rbac.constants';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(ChurchMemberEntity)
    private readonly churchMemberRepository: Repository<ChurchMemberEntity>,
  ) {}

  /**
   * ดึง permission codes ที่ user มีในบริบทนี้
   * - role แบบ global/personal: นับทุก request
   * - role แบบ church: นับเฉพาะเมื่อ churchId ตรงกับ scope_id
   */
  async getPermissionCodesForUser(userId: string, churchId?: string | null): Promise<Set<string>> {
    const baseQb = this.permissionRepository
      .createQueryBuilder('p')
      .select('p.code', 'code')
      .innerJoin('p.rolePermissions', 'rp')
      .innerJoin('rp.role', 'r')
      .innerJoin('r.userRoles', 'ur')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.deleted_at IS NULL')
      .andWhere('r.deleted_at IS NULL')
      .andWhere('(ur.effective_from IS NULL OR ur.effective_from <= NOW())')
      .andWhere('(ur.effective_to IS NULL OR ur.effective_to > NOW())')
      .andWhere(
        churchId
          ? '(ur.scope_type IN (:...baseScopes) OR (ur.scope_type = :churchScope AND ur.scope_id = :churchId))'
          : 'ur.scope_type IN (:...baseScopes)',
        churchId
          ? {
              baseScopes: ['global', 'personal'],
              churchScope: 'church',
              churchId,
            }
          : {
              baseScopes: ['global', 'personal'],
            },
      );

    const baseRows = await baseQb.getRawMany<{ code: string }>();

    if (!churchId) {
      return new Set(baseRows.map((r) => r.code));
    }

    const churchRows = await this.permissionRepository
      .createQueryBuilder('p')
      .select('p.code', 'code')
      .innerJoin('p.rolePermissions', 'rp')
      .innerJoin('rp.role', 'r')
      .innerJoin(ChurchMemberEntity, 'cm', 'cm.role_id = r.id')
      .where('cm.user_id = :userId', { userId })
      .andWhere('cm.church_id = :churchId', { churchId })
      .andWhere('cm.deleted_at IS NULL')
      .andWhere('r.deleted_at IS NULL')
      .getRawMany<{ code: string }>();

    return new Set([...baseRows, ...churchRows].map((r) => r.code));
  }

  async userHasAllPermissions(userId: string, permissionCodes: string[], churchId?: string | null): Promise<boolean> {
    if (permissionCodes.length === 0) {
      return true;
    }
    const held = await this.getPermissionCodesForUser(userId, churchId ?? null);
    return permissionCodes.every((code) => held.has(code));
  }

  async userHasAnyPermissions(userId: string, permissionCodes: string[], churchId?: string | null): Promise<boolean> {
    if (permissionCodes.length === 0) {
      return true;
    }
    const held = await this.getPermissionCodesForUser(userId, churchId ?? null);
    return permissionCodes.some((code) => held.has(code));
  }

  async userHasAnyRole(userId: string, roleCodes: string[], churchId?: string | null): Promise<boolean> {
    if (roleCodes.length === 0) {
      return true;
    }
    const qb = this.userRoleRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'r')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.deleted_at IS NULL')
      .andWhere('r.deleted_at IS NULL')
      .andWhere('r.code IN (:...codes)', { codes: roleCodes })
      .andWhere('(ur.effective_from IS NULL OR ur.effective_from <= NOW())')
      .andWhere('(ur.effective_to IS NULL OR ur.effective_to > NOW())')
      .andWhere(
        churchId
          ? '(ur.scope_type IN (:...baseScopes) OR (ur.scope_type = :churchScope AND ur.scope_id = :churchId))'
          : 'ur.scope_type IN (:...baseScopes)',
        churchId
          ? {
              baseScopes: ['global', 'personal'],
              churchScope: 'church',
              churchId,
            }
          : {
              baseScopes: ['global', 'personal'],
            },
      );

    const count = await qb.getCount();
    if (count > 0) {
      return true;
    }
    if (!churchId) {
      return false;
    }
    const cmCount = await this.churchMemberRepository
      .createQueryBuilder('cm')
      .innerJoin('cm.role', 'r')
      .where('cm.user_id = :userId', { userId })
      .andWhere('cm.church_id = :churchId', { churchId })
      .andWhere('cm.deleted_at IS NULL')
      .andWhere('r.deleted_at IS NULL')
      .andWhere('r.code IN (:...codes)', { codes: roleCodes })
      .getCount();
    return cmCount > 0;
  }

  /** มอบ role `user` แบบ personal scope หลังสร้างบัญชี (register / admin create) */
  async ensureDefaultPersonalUserRole(userId: string): Promise<void> {
    const userRoleCode = SYSTEM_ROLE_CODES.USER;
    const role = await this.roleRepository.findOne({
      where: {
        code: userRoleCode,
        deletedAt: IsNull(),
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (!role) {
      throw new InternalServerErrorException(`Default role '${userRoleCode}' is not configured`);
    }

    const existed = await this.userRoleRepository.findOne({
      where: {
        userId,
        roleId: role.id,
        scopeType: 'personal',
        scopeId: IsNull(),
        deletedAt: IsNull(),
      },
      select: {
        id: true,
      },
    });

    if (existed) {
      return;
    }

    await this.userRoleRepository.save(
      this.userRoleRepository.create({
        userId,
        roleId: role.id,
        scopeType: 'personal',
        scopeId: null,
        assignedBy: null,
        effectiveFrom: null,
        effectiveTo: null,
        deletedAt: null,
      }),
    );
  }
}
