import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { IsNull, Repository } from 'typeorm';

import { AuditLogService } from '../audit/audit-log.service';

import { SETLIST_AUDIT_ACTIONS } from './constants/audit-actions';
import { CreatePersonalSetlistDto } from './dto/create-personal-setlist.dto';
import { PersonalSetlistEntity } from './entities/personal-setlist.entity';
import { SetlistRequestMeta } from './types/setlist-request-meta.type';

@Injectable()
export class SetlistsService {
  constructor(
    @InjectRepository(PersonalSetlistEntity)
    private readonly personalRepo: Repository<PersonalSetlistEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  private generateShareToken(): string {
    return randomUUID().replaceAll('-', '');
  }

  async createPersonalSetlist(
    ownerUserId: string,
    dto: CreatePersonalSetlistDto,
    meta?: SetlistRequestMeta,
  ): Promise<PersonalSetlistEntity> {
    const isPublic = dto.isPublic ?? false;
    const shareToken = isPublic ? this.generateShareToken() : null;

    const queryRunner = this.personalRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const row = queryRunner.manager.create(PersonalSetlistEntity, {
        ownerUserId,
        title: dto.title,
        description: dto.description ?? null,
        isPublic,
        shareToken,
      });
      const saved = await queryRunner.manager.save(row);
      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        actorUserId: ownerUserId,
        actorType: 'user',
        action: SETLIST_AUDIT_ACTIONS.PERSONAL_CREATE,
        resourceType: 'personal_setlist',
        resourceId: saved.id,
        requestId: meta?.requestId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        beforeData: null,
        afterData: {
          title: saved.title,
          isPublic: saved.isPublic,
        },
      });

      return saved;
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to create personal setlist');
    } finally {
      await queryRunner.release();
    }
  }

  async listMyPersonalSetlists(ownerUserId: string): Promise<PersonalSetlistEntity[]> {
    return this.personalRepo.find({
      where: { ownerUserId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async enableSharingPersonalSetlist(
    ownerUserId: string,
    id: string,
    options: { rotate?: boolean } | undefined,
    meta?: SetlistRequestMeta,
  ): Promise<PersonalSetlistEntity> {
    const setlist = await this.personalRepo.findOne({
      where: { id, ownerUserId, deletedAt: IsNull() },
    });
    if (!setlist) {
      throw new NotFoundException('Setlist not found');
    }

    const beforeState = {
      isPublic: setlist.isPublic,
      hadShareToken: Boolean(setlist.shareToken),
    };

    const rotate = options?.rotate ?? false;
    const newToken =
      rotate || !setlist.shareToken
        ? this.generateShareToken()
        : setlist.shareToken;

    await this.personalRepo.update(
      { id: setlist.id },
      { isPublic: true, shareToken: newToken },
    );

    const updated = await this.personalRepo.findOneOrFail({
      where: { id: setlist.id },
    });

    await this.auditLogService.log({
      actorUserId: ownerUserId,
      actorType: 'user',
      action: SETLIST_AUDIT_ACTIONS.PERSONAL_SHARE_ENABLE,
      resourceType: 'personal_setlist',
      resourceId: updated.id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: beforeState,
      afterData: {
        isPublic: updated.isPublic,
        shareTokenRotated: rotate || !beforeState.hadShareToken,
      },
      metadata: { rotate: Boolean(rotate) },
    });

    return updated;
  }
}
