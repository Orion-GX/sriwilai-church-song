import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { redactStructuredData } from '../../common/utils/sensitive-data.util';

import { AuditLogEntity } from './entities/audit-log.entity';

export type AuditActorType = 'user' | 'system' | 'guest';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogInput {
  actorUserId?: string | null;
  actorType: AuditActorType;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  scopeChurchId?: string | null;
  requestId?: string | null;
  ipAddress?: string;
  userAgent?: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  severity?: AuditSeverity;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    const row = this.auditLogRepository.create({
      occurredAt: new Date(),
      actorUserId: input.actorUserId ?? null,
      actorType: input.actorType,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      scopeChurchId: input.scopeChurchId ?? null,
      requestId: input.requestId ?? null,
      ipHash: input.ipAddress ? this.hashIp(input.ipAddress) : null,
      userAgent: this.truncateUserAgent(input.userAgent),
      beforeData: this.sanitizeJsonField(input.beforeData),
      afterData: this.sanitizeJsonField(input.afterData),
      metadata: this.sanitizeJsonField(input.metadata),
      severity: input.severity ?? 'info',
    });
    await this.auditLogRepository.save(row);
  }

  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }

  private truncateUserAgent(ua?: string): string | null {
    if (!ua) {
      return null;
    }
    return ua.length > 500 ? `${ua.slice(0, 497)}...` : ua;
  }

  /** before_data / after_data / metadata — redact คีย์อ่อนไหวแบบลึก */
  private sanitizeJsonField(
    data?: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!data) {
      return null;
    }
    return redactStructuredData(data) as Record<string, unknown>;
  }
}
