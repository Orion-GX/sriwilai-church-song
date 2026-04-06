import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { AuditLogService } from '../audit/audit-log.service';
import { RbacService } from '../rbac/rbac.service';
import { SYSTEM_PERMISSION_CODES } from '../rbac/rbac.constants';
import { SongEntity } from '../songs/entities/song.entity';

import { LIVE_AUDIT_ACTIONS } from './constants/audit-actions';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import type { LivePagePayloadDto } from './dto/ws/live-sync-page.dto';
import { LiveSessionSongEntity } from './entities/live-session-song.entity';
import { LiveSessionEntity } from './entities/live-session.entity';
import type { LiveSyncState } from './types/live-sync-state.type';
import type {
  LiveSessionSongRowPayload,
  LiveSessionStateServerPayload,
} from './types/live-ws-payloads.type';

export interface LiveRequestMeta {
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class LiveService {
  constructor(
    @InjectRepository(LiveSessionEntity)
    private readonly sessionRepo: Repository<LiveSessionEntity>,
    @InjectRepository(LiveSessionSongEntity)
    private readonly liveSongRepo: Repository<LiveSessionSongEntity>,
    @InjectRepository(SongEntity)
    private readonly songRepo: Repository<SongEntity>,
    private readonly rbacService: RbacService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createSession(
    actorUserId: string,
    churchScopeId: string | null,
    dto: CreateLiveSessionDto,
    meta?: LiveRequestMeta,
  ): Promise<LiveSessionEntity> {
    const ok = await this.rbacService.userHasAllPermissions(
      actorUserId,
      [SYSTEM_PERMISSION_CODES.LIVE_MANAGE],
      churchScopeId,
    );
    if (!ok) {
      throw new ForbiddenException('Insufficient permission');
    }

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        churchId: churchScopeId,
        leaderUserId: actorUserId,
        title: dto.title,
        status: 'active',
        syncState: {
          songIndex: 0,
          pageVersion: 0,
          updatedAt: new Date().toISOString(),
        },
        endedAt: null,
        deletedAt: null,
      }),
    );

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: LIVE_AUDIT_ACTIONS.SESSION_CREATE,
      resourceType: 'live_session',
      resourceId: session.id,
      scopeChurchId: session.churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: null,
      afterData: { title: session.title, churchId: session.churchId },
    });

    return session;
  }

  async listActiveSessions(actorUserId: string, churchId?: string): Promise<LiveSessionEntity[]> {
    const scope = churchId ?? null;
    const ok = await this.rbacService.userHasAllPermissions(
      actorUserId,
      [SYSTEM_PERMISSION_CODES.LIVE_READ],
      scope,
    );
    if (!ok) {
      throw new ForbiddenException('Insufficient permission');
    }

    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .where('s.deleted_at IS NULL')
      .andWhere("s.status = 'active'");

    if (churchId) {
      qb.andWhere('s.church_id = :churchId', { churchId });
    } else {
      qb.andWhere('s.church_id IS NULL');
    }

    return qb.orderBy('s.createdAt', 'DESC').getMany();
  }

  async getSessionEntityForUser(userId: string, sessionId: string): Promise<LiveSessionEntity> {
    await this.assertReadSession(userId, sessionId);
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  async loadSessionWithSongs(sessionId: string): Promise<LiveSessionEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
      relations: { sessionSongs: { song: true } },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.sessionSongs?.length) {
      session.sessionSongs.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
    }
    return session;
  }

  async getSessionStateForApi(userId: string, sessionId: string): Promise<LiveSessionStateServerPayload> {
    await this.assertReadSession(userId, sessionId);
    const session = await this.loadSessionWithSongs(sessionId);
    return this.buildStatePayload(session);
  }

  async endSession(
    actorUserId: string,
    sessionId: string,
    meta?: LiveRequestMeta,
  ): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const canEnd =
      session.leaderUserId === actorUserId ||
      (await this.rbacService.userHasAllPermissions(
        actorUserId,
        [SYSTEM_PERMISSION_CODES.LIVE_MANAGE],
        session.churchId,
      ));

    if (!canEnd) {
      throw new ForbiddenException('Insufficient permission');
    }

    session.status = 'ended';
    session.endedAt = new Date();
    await this.sessionRepo.save(session);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: LIVE_AUDIT_ACTIONS.SESSION_END,
      resourceType: 'live_session',
      resourceId: sessionId,
      scopeChurchId: session.churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: { status: 'active' },
      afterData: { status: 'ended' },
    });
  }

  async addSong(
    actorUserId: string,
    sessionId: string,
    songId: string,
    position?: number,
  ): Promise<LiveSessionSongEntity[]> {
    const session = await this.loadSessionWithSongs(sessionId);
    this.assertSessionActive(session);
    await this.assertPlaylistEdit(actorUserId, session);

    const song = await this.songRepo.findOne({
      where: { id: songId, deletedAt: IsNull(), isPublished: true },
    });
    if (!song) {
      throw new BadRequestException('Song not found or not published');
    }

    const dupe = await this.liveSongRepo.findOne({ where: { sessionId, songId } });
    if (dupe) {
      throw new BadRequestException('Song already in this session');
    }

    const row = await this.liveSongRepo.save(
      this.liveSongRepo.create({
        sessionId,
        songId,
        sortOrder: 999999,
      }),
    );

    const all = await this.liveSongRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    const without = all.filter((r) => r.id !== row.id);
    const pos = position === undefined ? without.length : Math.max(0, Math.min(position, without.length));
    const ordered = [...without.slice(0, pos), row, ...without.slice(pos)];
    ordered.forEach((r, i) => {
      r.sortOrder = i;
    });
    await this.liveSongRepo.save(ordered);

    return this.liveSongRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC' },
      relations: { song: true },
    });
  }

  async removeSong(
    actorUserId: string,
    sessionId: string,
    liveSongId: string,
  ): Promise<LiveSessionSongEntity[]> {
    const session = await this.loadSessionWithSongs(sessionId);
    this.assertSessionActive(session);
    await this.assertPlaylistEdit(actorUserId, session);

    const row = await this.liveSongRepo.findOne({ where: { id: liveSongId, sessionId } });
    if (!row) {
      throw new NotFoundException('Live song entry not found');
    }

    await this.liveSongRepo.remove(row);

    const rest = await this.liveSongRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    rest.forEach((r, i) => {
      r.sortOrder = i;
    });
    await this.liveSongRepo.save(rest);

    return this.liveSongRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC' },
      relations: { song: true },
    });
  }

  async reorderSongs(
    actorUserId: string,
    sessionId: string,
    orderedLiveSongIds: string[],
  ): Promise<LiveSessionSongEntity[]> {
    const session = await this.loadSessionWithSongs(sessionId);
    this.assertSessionActive(session);
    await this.assertPlaylistEdit(actorUserId, session);

    const existing = await this.liveSongRepo.find({
      where: { sessionId },
    });
    if (existing.length !== orderedLiveSongIds.length) {
      throw new BadRequestException('Count mismatch for reorder');
    }
    const idSet = new Set(existing.map((r) => r.id));
    for (const id of orderedLiveSongIds) {
      if (!idSet.has(id)) {
        throw new BadRequestException('Invalid live song id in reorder list');
      }
    }

    const byId = new Map(existing.map((r) => [r.id, r]));
    const ordered = orderedLiveSongIds.map((id, i) => {
      const r = byId.get(id)!;
      r.sortOrder = i;
      return r;
    });
    await this.liveSongRepo.save(ordered);

    return this.liveSongRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC' },
      relations: { song: true },
    });
  }

  async leaderPublishSync(
    actorUserId: string,
    sessionId: string,
    page: LivePagePayloadDto,
  ): Promise<LiveSyncState> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    this.assertSessionActive(session);

    if (session.leaderUserId !== actorUserId) {
      throw new ForbiddenException('Only the session leader can broadcast page sync');
    }

    const prevVersion = session.syncState?.pageVersion ?? 0;
    const sync: LiveSyncState = {
      songIndex: page.songIndex,
      sectionLabel: page.sectionLabel ?? null,
      lineIndex: page.lineIndex ?? null,
      charOffset: page.charOffset ?? null,
      scrollRatio: page.scrollRatio ?? null,
      meta: page.meta ?? undefined,
      pageVersion: prevVersion + 1,
      updatedAt: new Date().toISOString(),
    };

    session.syncState = sync;
    await this.sessionRepo.save(session);
    return sync;
  }

  buildStatePayload(session: LiveSessionEntity): LiveSessionStateServerPayload {
    const songs: LiveSessionSongRowPayload[] = [...(session.sessionSongs ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => ({
        liveSongId: r.id,
        songId: r.songId,
        sortOrder: r.sortOrder,
        title: r.song?.title ?? '',
        slug: r.song?.slug ?? '',
      }));

    return {
      v: 1,
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        leaderUserId: session.leaderUserId,
        churchId: session.churchId,
        syncState: session.syncState,
        createdAt: session.createdAt.toISOString(),
      },
      songs,
    };
  }

  mapSongsPayload(sessionId: string, rows: LiveSessionSongEntity[]): {
    v: 1;
    sessionId: string;
    songs: LiveSessionSongRowPayload[];
  } {
    return {
      v: 1,
      sessionId,
      songs: rows.map((r) => ({
        liveSongId: r.id,
        songId: r.songId,
        sortOrder: r.sortOrder,
        title: r.song?.title ?? '',
        slug: r.song?.slug ?? '',
      })),
    };
  }

  async assertReadSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
      select: { id: true, churchId: true },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    const ok = await this.rbacService.userHasAllPermissions(
      userId,
      [SYSTEM_PERMISSION_CODES.LIVE_READ],
      session.churchId,
    );
    if (!ok) {
      throw new NotFoundException('Session not found');
    }
  }

  async assertJoinAsLeader(userId: string, sessionId: string): Promise<LiveSessionEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.leaderUserId !== userId) {
      throw new ForbiddenException('Only the designated leader can join in leader mode');
    }
    await this.assertReadSession(userId, sessionId);
    return session;
  }

  private assertSessionActive(session: LiveSessionEntity): void {
    if (session.status !== 'active') {
      throw new BadRequestException('Session is not active');
    }
  }

  private async assertPlaylistEdit(userId: string, session: LiveSessionEntity): Promise<void> {
    if (session.leaderUserId === userId) {
      return;
    }
    const ok = await this.rbacService.userHasAllPermissions(
      userId,
      [SYSTEM_PERMISSION_CODES.LIVE_MANAGE],
      session.churchId,
    );
    if (!ok) {
      throw new ForbiddenException('Insufficient permission');
    }
  }
}
