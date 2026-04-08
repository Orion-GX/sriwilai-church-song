import { createHash, randomUUID } from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsNull, Repository } from 'typeorm';

import { AuditLogService } from '../audit/audit-log.service';
import { AppConfiguration } from '../../config/configuration';
import { RbacService } from '../rbac/rbac.service';
import { AUTH_AUDIT_ACTIONS } from './constants/audit-actions';
import { ChurchMemberEntity } from '../churches/entities/church-member.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshSessionEntity } from './entities/refresh-session.entity';
import { UserRoleEntity } from '../rbac/entities/user-role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { JwtPayload } from './types/jwt-payload.type';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export type IssuedTokens = AuthResponseDto & { refreshToken: string; sessionId: string };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RefreshSessionEntity)
    private readonly refreshSessionRepository: Repository<RefreshSessionEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(ChurchMemberEntity)
    private readonly churchMemberRepository: Repository<ChurchMemberEntity>,
    private readonly rbacService: RbacService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfiguration, true>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async register(payload: RegisterDto, meta: RequestMeta): Promise<IssuedTokens> {
    const existed = await this.userRepository.findOne({
      where: {
        email: payload.email.toLowerCase(),
        deletedAt: IsNull(),
      },
    });
    if (existed) {
      throw new UnauthorizedException('Email already in use');
    }

    const authConfig = this.configService.get('auth', { infer: true });
    const passwordHash = await bcrypt.hash(payload.password, authConfig.bcryptSaltRounds);

    const user = this.userRepository.create({
      email: payload.email.toLowerCase(),
      passwordHash,
      displayName: payload.displayName,
      status: 'active',
      emailVerifiedAt: null,
      lastLoginAt: new Date(),
      deletedAt: null,
    });

    const createdUser = await this.userRepository.save(user);
    await this.rbacService.ensureDefaultPersonalUserRole(createdUser.id);
    const issued = await this.issueTokensForUser(createdUser, meta);
    await this.auditLogService.log({
      actorUserId: createdUser.id,
      actorType: 'user',
      action: AUTH_AUDIT_ACTIONS.REGISTER_SUCCESS,
      resourceType: 'user',
      resourceId: createdUser.id,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      afterData: {
        email: createdUser.email,
        displayName: createdUser.displayName,
      },
      metadata: { sessionId: issued.sessionId },
    });
    return issued;
  }

  async login(payload: LoginDto, meta: RequestMeta): Promise<IssuedTokens> {
    const emailNormalized = payload.email.toLowerCase();
    const user = await this.userRepository.findOne({
      where: {
        email: emailNormalized,
        deletedAt: IsNull(),
      },
    });
    if (!user) {
      await this.logLoginFailure(emailNormalized, meta, 'credentials_mismatch');
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== 'active') {
      await this.logLoginFailure(emailNormalized, meta, 'account_inactive');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.logLoginFailure(emailNormalized, meta, 'credentials_mismatch');
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const issued = await this.issueTokensForUser(user, meta);
    await this.auditLogService.log({
      actorUserId: user.id,
      actorType: 'user',
      action: AUTH_AUDIT_ACTIONS.LOGIN_SUCCESS,
      resourceType: 'user',
      resourceId: user.id,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { sessionId: issued.sessionId },
    });
    return issued;
  }

  async refreshTokens(
    refreshToken: string,
    refreshPayload: JwtPayload,
    meta: RequestMeta,
  ): Promise<IssuedTokens> {
    const oldSession = await this.refreshSessionRepository.findOne({
      where: {
        id: refreshPayload.sessionId,
        userId: refreshPayload.sub,
      },
    });

    if (!oldSession || oldSession.revokedAt || oldSession.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh session is invalid');
    }

    const isMatched = await bcrypt.compare(refreshToken, oldSession.refreshTokenHash);
    if (!isMatched) {
      await this.revokeSessionFamily(oldSession.sessionFamilyId, 'refresh_token_reuse_detected');
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: oldSession.userId,
        deletedAt: IsNull(),
      },
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    oldSession.revokedAt = new Date();
    oldSession.revokeReason = 'rotated';
    oldSession.lastSeenAt = new Date();
    await this.refreshSessionRepository.save(oldSession);

    const issued = await this.issueTokensForUser(user, meta, oldSession.sessionFamilyId, oldSession.id);
    await this.auditLogService.log({
      actorUserId: user.id,
      actorType: 'user',
      action: AUTH_AUDIT_ACTIONS.TOKEN_REFRESH,
      resourceType: 'auth_session',
      resourceId: issued.sessionId,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        previousSessionId: refreshPayload.sessionId,
        newSessionId: issued.sessionId,
      },
    });
    return issued;
  }

  async logout(userId: string, sessionId: string, meta: RequestMeta): Promise<void> {
    const updateResult = await this.refreshSessionRepository.update(
      { id: sessionId, userId, revokedAt: IsNull() },
      {
        revokedAt: new Date(),
        revokeReason: 'logout',
      },
    );
    await this.auditLogService.log({
      actorUserId: userId,
      actorType: 'user',
      action: AUTH_AUDIT_ACTIONS.LOGOUT,
      resourceType: 'auth_session',
      resourceId: sessionId,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { rowsAffected: updateResult.affected ?? 0 },
    });
  }

  async getCurrentUser(userId: string): Promise<AuthResponseDto['user']> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        deletedAt: IsNull(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.buildAuthUserPayload(user);
  }

  private async issueTokensForUser(
    user: UserEntity,
    meta: RequestMeta,
    sessionFamilyId?: string,
    rotatedFromSessionId?: string,
  ): Promise<IssuedTokens> {
    const authConfig = this.configService.get('auth', { infer: true });
    const sessionId = randomUUID();
    const familyId = sessionFamilyId ?? randomUUID();

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sessionId,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sessionId,
      type: 'refresh',
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: authConfig.accessTokenSecret,
      expiresIn: authConfig.accessTokenExpiresIn,
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: authConfig.refreshTokenSecret,
      expiresIn: `${authConfig.refreshTokenExpiresInDays}d`,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, authConfig.bcryptSaltRounds);
    const expiresAt = new Date(Date.now() + authConfig.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);

    await this.refreshSessionRepository.save(
      this.refreshSessionRepository.create({
        id: sessionId,
        userId: user.id,
        sessionFamilyId: familyId,
        refreshTokenHash,
        expiresAt,
        revokedAt: null,
        revokeReason: null,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        rotatedFromSessionId: rotatedFromSessionId ?? null,
        lastSeenAt: new Date(),
      }),
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: authConfig.accessTokenExpiresIn,
      refreshToken,
      sessionId,
      user: await this.buildAuthUserPayload(user),
    };
  }

  private async buildAuthUserPayload(user: Pick<UserEntity, 'id' | 'email' | 'displayName'>): Promise<AuthResponseDto['user']> {
    const [systemRoleRows, churchRows, systemPermissions] = await Promise.all([
      this.userRoleRepository
        .createQueryBuilder('ur')
        .innerJoin('ur.role', 'r')
        .select('r.code', 'code')
        .where('ur.user_id = :userId', { userId: user.id })
        .andWhere('ur.deleted_at IS NULL')
        .andWhere('r.deleted_at IS NULL')
        .andWhere('ur.scope_type IN (:...scopes)', { scopes: ['global', 'personal'] })
        .andWhere('(ur.effective_from IS NULL OR ur.effective_from <= NOW())')
        .andWhere('(ur.effective_to IS NULL OR ur.effective_to > NOW())')
        .getRawMany<{ code: string }>(),
      this.churchMemberRepository
        .createQueryBuilder('cm')
        .innerJoin('cm.role', 'r')
        .leftJoin('r.rolePermissions', 'rp')
        .leftJoin('rp.permission', 'p')
        .select('cm.church_id', 'churchId')
        .addSelect('r.code', 'roleCode')
        .addSelect('p.code', 'permissionCode')
        .where('cm.user_id = :userId', { userId: user.id })
        .andWhere('cm.deleted_at IS NULL')
        .andWhere('r.deleted_at IS NULL')
        .getRawMany<{ churchId: string; roleCode: string; permissionCode: string | null }>(),
      this.rbacService.getPermissionCodesForUser(user.id, null),
    ]);

    const byChurch = new Map<string, { roleCode: string; permissions: Set<string> }>();
    for (const row of churchRows) {
      const current = byChurch.get(row.churchId) ?? { roleCode: row.roleCode, permissions: new Set<string>() };
      if (row.permissionCode) {
        current.permissions.add(row.permissionCode);
      }
      byChurch.set(row.churchId, current);
    }

    const churchMemberships = Array.from(byChurch.entries()).map(([churchId, info]) => ({
      churchId,
      roleCode: info.roleCode,
      permissions: Array.from(info.permissions),
    }));

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      systemRoles: Array.from(new Set(systemRoleRows.map((x) => x.code))),
      systemPermissions: Array.from(systemPermissions),
      currentChurchId: churchMemberships[0]?.churchId ?? null,
      churchMemberships,
    };
  }

  /**
   * บันทึกความพยายามล็อกอินล้มเหลว (สำหรับ SIEM / brute-force monitoring)
   * ไม่เก็บอีเมล plaintext — ใช้ SHA-256 ของอีเมลที่ normalize แล้ว
   */
  private async logLoginFailure(
    emailNormalized: string,
    meta: RequestMeta,
    failureReason: 'credentials_mismatch' | 'account_inactive',
  ): Promise<void> {
    const emailHash = createHash('sha256').update(emailNormalized).digest('hex');
    await this.auditLogService.log({
      actorUserId: null,
      actorType: 'guest',
      action: AUTH_AUDIT_ACTIONS.LOGIN_FAILURE,
      resourceType: 'auth_login',
      resourceId: null,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      severity: 'warning',
      metadata: {
        failure_reason: failureReason,
        email_hash: emailHash,
      },
    });
  }

  private async revokeSessionFamily(sessionFamilyId: string, reason: string): Promise<void> {
    await this.refreshSessionRepository
      .createQueryBuilder()
      .update(RefreshSessionEntity)
      .set({
        revokedAt: () => 'NOW()',
        revokeReason: reason,
      })
      .where('session_family_id = :sessionFamilyId', { sessionFamilyId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

}
