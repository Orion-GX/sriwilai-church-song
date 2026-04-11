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
import { AddSetlistItemDto } from './dto/add-setlist-item.dto';
import {
  CreatePersonalSetlistDto,
  CreatePersonalSetlistItemDto,
} from './dto/create-personal-setlist.dto';
import { ReorderSetlistItemsDto } from './dto/reorder-setlist-items.dto';
import { UpdatePersonalSetlistDto } from './dto/update-personal-setlist.dto';
import { UpdateSetlistItemDto } from './dto/update-setlist-item.dto';
import { UpdateSetlistVisibilityDto } from './dto/update-setlist-visibility.dto';
import { PersonalSetlistItemEntity } from './entities/personal-setlist-item.entity';
import { PersonalSetlistEntity } from './entities/personal-setlist.entity';
import { SetlistRequestMeta } from './types/setlist-request-meta.type';

type SetlistDetails = PersonalSetlistEntity & {
  items: PersonalSetlistItemEntity[];
};

@Injectable()
export class SetlistsService {
  constructor(
    @InjectRepository(PersonalSetlistEntity)
    private readonly personalRepo: Repository<PersonalSetlistEntity>,
    @InjectRepository(PersonalSetlistItemEntity)
    private readonly itemRepo: Repository<PersonalSetlistItemEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  private generateShareToken(): string {
    return randomUUID().replaceAll('-', '');
  }

  private buildPublicUrl(shareToken: string | null): string | null {
    if (!shareToken) return null;
    return `/public/setlists/${shareToken}`;
  }

  private mapSetlistResponse(row: SetlistDetails) {
    const ordered = [...(row.items ?? [])].sort((a, b) => a.order - b.order);
    return {
      id: row.id,
      ownerUserId: row.ownerUserId,
      churchId: row.churchId,
      title: row.title,
      description: row.description,
      serviceDate: row.serviceDate?.toISOString() ?? null,
      location: row.location,
      durationMinutes: row.durationMinutes,
      totalItems: ordered.length,
      teamName: row.teamName,
      isPublic: row.isPublic,
      publicSlug: row.shareToken,
      publicToken: row.shareToken,
      publicUrl: this.buildPublicUrl(row.shareToken),
      presentationLayout: row.presentationLayout,
      createdBy: row.ownerUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      songs: ordered.map((item) => ({
        id: item.id,
        songId: item.songId,
        title: item.title,
        artist: item.artist,
        originalKey: item.originalKey,
        selectedKey: item.selectedKey,
        bpm: item.bpm,
        order: item.order,
        transitionNotes: item.transitionNotes,
        notes: item.notes,
        capo: item.capo,
        duration: item.duration,
        arrangement: item.arrangement,
        version: item.version,
        updatedAt: item.updatedAt,
      })),
    };
  }

  private normalizeNewItems(setlistId: string, songs: CreatePersonalSetlistItemDto[] | undefined) {
    return (songs ?? []).map((song, idx) =>
      this.itemRepo.create({
        setlistId,
        songId: song.songId,
        title: song.title,
        artist: song.artist ?? null,
        originalKey: song.originalKey ?? null,
        selectedKey: song.selectedKey ?? song.originalKey ?? null,
        bpm: song.bpm ?? null,
        order: idx,
        transitionNotes: song.transitionNotes ?? null,
        notes: song.notes ?? null,
        capo: song.capo ?? null,
        duration: song.duration ?? null,
        arrangement: song.arrangement ?? null,
        version: song.version ?? null,
      }),
    );
  }

  private async loadOwnedSetlist(ownerUserId: string, id: string): Promise<SetlistDetails> {
    const setlist = await this.personalRepo.findOne({
      where: { id, ownerUserId, deletedAt: IsNull() },
      relations: { items: true },
    });
    if (!setlist) {
      throw new NotFoundException('Setlist not found');
    }
    return setlist as SetlistDetails;
  }

  async createPersonalSetlist(
    ownerUserId: string,
    dto: CreatePersonalSetlistDto,
    meta?: SetlistRequestMeta,
  ) {
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
        serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : null,
        location: dto.location ?? null,
        durationMinutes: dto.durationMinutes ?? null,
        teamName: dto.teamName ?? null,
        presentationLayout: dto.presentationLayout ?? 'vertical',
        isPublic,
        shareToken,
      });
      const saved = await queryRunner.manager.save(row);

      const itemRows = this.normalizeNewItems(saved.id, dto.songs);
      if (itemRows.length > 0) {
        await queryRunner.manager.save(itemRows);
      }
      await queryRunner.commitTransaction();

      const result = await this.loadOwnedSetlist(ownerUserId, saved.id);

      await this.auditLogService.log({
        actorUserId: ownerUserId,
        actorType: 'user',
        action: SETLIST_AUDIT_ACTIONS.PERSONAL_CREATE,
        resourceType: 'personal_setlist',
        resourceId: result.id,
        requestId: meta?.requestId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        beforeData: null,
        afterData: {
          title: result.title,
          isPublic: result.isPublic,
          itemCount: result.items.length,
        },
      });

      return this.mapSetlistResponse(result);
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to create personal setlist');
    } finally {
      await queryRunner.release();
    }
  }

  async listMyPersonalSetlists(ownerUserId: string) {
    const rows = await this.personalRepo.find({
      where: { ownerUserId, deletedAt: IsNull() },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.mapSetlistResponse(row as SetlistDetails));
  }

  async getPersonalSetlistById(ownerUserId: string, id: string) {
    const row = await this.loadOwnedSetlist(ownerUserId, id);
    return this.mapSetlistResponse(row);
  }

  async updatePersonalSetlist(
    ownerUserId: string,
    id: string,
    dto: UpdatePersonalSetlistDto,
    meta?: SetlistRequestMeta,
  ) {
    const before = await this.loadOwnedSetlist(ownerUserId, id);

    await this.personalRepo.update(
      { id: before.id },
      {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.serviceDate !== undefined ? { serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : null } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
        ...(dto.teamName !== undefined ? { teamName: dto.teamName } : {}),
        ...(dto.presentationLayout !== undefined ? { presentationLayout: dto.presentationLayout } : {}),
        ...(dto.isPublic !== undefined
          ? {
              isPublic: dto.isPublic,
              shareToken: dto.isPublic ? before.shareToken ?? this.generateShareToken() : null,
            }
          : {}),
      },
    );

    const updated = await this.loadOwnedSetlist(ownerUserId, id);
    await this.auditLogService.log({
      actorUserId: ownerUserId,
      actorType: 'user',
      action: SETLIST_AUDIT_ACTIONS.PERSONAL_UPDATE,
      resourceType: 'personal_setlist',
      resourceId: id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: {
        title: before.title,
        durationMinutes: before.durationMinutes,
        isPublic: before.isPublic,
      },
      afterData: {
        title: updated.title,
        durationMinutes: updated.durationMinutes,
        isPublic: updated.isPublic,
      },
    });
    return this.mapSetlistResponse(updated);
  }

  async reorderSetlistItems(ownerUserId: string, id: string, dto: ReorderSetlistItemsDto) {
    const setlist = await this.loadOwnedSetlist(ownerUserId, id);
    const itemIds = new Set(setlist.items.map((item) => item.id));
    const allBelongToSet = dto.items.every((item) => itemIds.has(item.id));
    if (!allBelongToSet) {
      throw new NotFoundException('Some setlist items were not found');
    }

    const queryRunner = this.itemRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const entry of dto.items) {
        await queryRunner.manager.update(
          PersonalSetlistItemEntity,
          { id: entry.id, setlistId: setlist.id },
          { order: entry.order + 10_000 },
        );
      }
      for (const entry of dto.items) {
        await queryRunner.manager.update(
          PersonalSetlistItemEntity,
          { id: entry.id, setlistId: setlist.id },
          { order: entry.order },
        );
      }
      await queryRunner.commitTransaction();
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to reorder setlist items');
    } finally {
      await queryRunner.release();
    }

    const updated = await this.loadOwnedSetlist(ownerUserId, id);
    return this.mapSetlistResponse(updated);
  }

  async updateSetlistItem(
    ownerUserId: string,
    setlistId: string,
    itemId: string,
    dto: UpdateSetlistItemDto,
  ) {
    await this.loadOwnedSetlist(ownerUserId, setlistId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, setlistId },
    });
    if (!item) {
      throw new NotFoundException('Setlist item not found');
    }

    await this.itemRepo.update(
      { id: item.id },
      {
        ...(dto.songId !== undefined ? { songId: dto.songId } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.artist !== undefined ? { artist: dto.artist } : {}),
        ...(dto.originalKey !== undefined ? { originalKey: dto.originalKey } : {}),
        ...(dto.selectedKey !== undefined ? { selectedKey: dto.selectedKey } : {}),
        ...(dto.bpm !== undefined ? { bpm: dto.bpm } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.transitionNotes !== undefined ? { transitionNotes: dto.transitionNotes } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.capo !== undefined ? { capo: dto.capo } : {}),
        ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
        ...(dto.arrangement !== undefined ? { arrangement: dto.arrangement } : {}),
        ...(dto.version !== undefined ? { version: dto.version } : {}),
      },
    );

    const updated = await this.loadOwnedSetlist(ownerUserId, setlistId);
    return this.mapSetlistResponse(updated);
  }

  async addSetlistItem(ownerUserId: string, setlistId: string, dto: AddSetlistItemDto) {
    const setlist = await this.loadOwnedSetlist(ownerUserId, setlistId);
    const maxOrder = setlist.items.reduce((acc, row) => Math.max(acc, row.order), -1);
    await this.itemRepo.save(
      this.itemRepo.create({
        setlistId,
        songId: dto.songId,
        title: dto.title,
        artist: dto.artist ?? null,
        originalKey: dto.originalKey ?? null,
        selectedKey: dto.selectedKey ?? dto.originalKey ?? null,
        bpm: dto.bpm ?? null,
        order: maxOrder + 1,
        transitionNotes: dto.transitionNotes ?? null,
        notes: dto.notes ?? null,
        capo: dto.capo ?? null,
        duration: dto.duration ?? null,
        arrangement: dto.arrangement ?? null,
        version: dto.version ?? null,
      }),
    );
    const updated = await this.loadOwnedSetlist(ownerUserId, setlistId);
    return this.mapSetlistResponse(updated);
  }

  async setSetlistVisibility(
    ownerUserId: string,
    id: string,
    options: UpdateSetlistVisibilityDto,
    meta?: SetlistRequestMeta,
  ) {
    const setlist = await this.loadOwnedSetlist(ownerUserId, id);
    const isPublic = options.isPublic;
    await this.personalRepo.update(
      { id: setlist.id },
      {
        isPublic,
        shareToken: isPublic ? setlist.shareToken ?? this.generateShareToken() : null,
      },
    );
    const updated = await this.loadOwnedSetlist(ownerUserId, id);
    await this.auditLogService.log({
      actorUserId: ownerUserId,
      actorType: 'user',
      action: isPublic
        ? SETLIST_AUDIT_ACTIONS.PERSONAL_SHARE_ENABLE
        : SETLIST_AUDIT_ACTIONS.PERSONAL_SHARE_DISABLE,
      resourceType: 'personal_setlist',
      resourceId: id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: { isPublic: setlist.isPublic },
      afterData: { isPublic: updated.isPublic },
    });
    return this.mapSetlistResponse(updated);
  }

  async enableSharingPersonalSetlist(
    ownerUserId: string,
    id: string,
    options: { rotate?: boolean } | undefined,
    meta?: SetlistRequestMeta,
  ) {
    const setlist = await this.loadOwnedSetlist(ownerUserId, id);

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

    const updated = await this.loadOwnedSetlist(ownerUserId, setlist.id);

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

    return this.mapSetlistResponse(updated);
  }

  async getPublicSetlistBySlug(slug: string) {
    const setlist = await this.personalRepo.findOne({
      where: { shareToken: slug, isPublic: true, deletedAt: IsNull() },
      relations: { items: true },
    });
    if (!setlist) {
      throw new NotFoundException('Setlist unavailable');
    }
    return this.mapSetlistResponse(setlist as SetlistDetails);
  }
}
