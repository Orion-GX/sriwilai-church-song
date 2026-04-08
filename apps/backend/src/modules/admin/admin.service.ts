import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThanOrEqual, Repository } from 'typeorm';

import { LiveSessionEntity } from '../live/entities/live-session.entity';
import { SongEntity } from '../songs/entities/song.entity';
import { UserEntity } from '../users/entities/user.entity';

import {
  AdminDashboardDto,
  AdminLiveSessionSummaryDto,
  AdminSongDailyCountDto,
  AdminTopSongDto,
} from './dto/admin-dashboard.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(SongEntity)
    private readonly songRepo: Repository<SongEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(LiveSessionEntity)
    private readonly liveRepo: Repository<LiveSessionEntity>,
  ) {}

  async getDashboard(): Promise<AdminDashboardDto> {
    const now = new Date();
    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 7);
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 30);
    const d14 = new Date(now);
    d14.setDate(d14.getDate() - 13);
    const startDay = d14.toISOString().slice(0, 10);

    const songsTotal = await this.songRepo.count({
      where: { deletedAt: IsNull() },
    });

    const songsNewLast7Days = await this.songRepo.count({
      where: { deletedAt: IsNull(), createdAt: MoreThanOrEqual(d7) },
    });

    const songsNewLast30Days = await this.songRepo.count({
      where: { deletedAt: IsNull(), createdAt: MoreThanOrEqual(d30) },
    });

    const songsCreatedByDay = await this.songsCreatedLast14Days(startDay);

    const topRows = await this.songRepo.find({
      where: { deletedAt: IsNull(), isPublished: true },
      order: { viewCount: 'DESC' },
      take: 10,
      select: { id: true, title: true, slug: true, viewCount: true },
    });

    const topViewedSongs: AdminTopSongDto[] = topRows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      viewCount: r.viewCount,
    }));

    const usersTotal = await this.userRepo.count({
      where: { deletedAt: IsNull() },
    });

    const usersNewLast7Days = await this.userRepo.count({
      where: { deletedAt: IsNull(), createdAt: MoreThanOrEqual(d7) },
    });

    const liveActiveSessions = await this.liveRepo.count({
      where: { deletedAt: IsNull(), status: 'active' },
    });

    const liveSessionsTotal = await this.liveRepo.count({
      where: { deletedAt: IsNull() },
    });

    const recentLive = await this.liveRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        leaderUserId: true,
        createdAt: true,
      },
    });

    const liveRecentSessions: AdminLiveSessionSummaryDto[] = recentLive.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      leaderUserId: s.leaderUserId,
      createdAt: s.createdAt.toISOString(),
    }));

    return {
      songsTotal,
      songsNewLast7Days,
      songsNewLast30Days,
      songsCreatedByDay,
      topViewedSongs,
      usersTotal,
      usersNewLast7Days,
      liveActiveSessions,
      liveSessionsTotal,
      liveRecentSessions,
    };
  }

  private async songsCreatedLast14Days(firstDayIso: string): Promise<AdminSongDailyCountDto[]> {
    const raw: { day: string; cnt: string }[] = await this.songRepo.query(
      `
      WITH days AS (
        SELECT generate_series(
          $1::date,
          (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
          '1 day'::interval
        )::date AS day
      )
      SELECT d.day::text AS day, COUNT(s.id)::text AS cnt
      FROM days d
      LEFT JOIN "${this.songRepo.metadata.schema}"."songs" s
        ON (s.created_at AT TIME ZONE 'UTC')::date = d.day
        AND s.deleted_at IS NULL
      GROUP BY d.day
      ORDER BY d.day ASC
      `,
      [firstDayIso],
    );

    return raw.map((r) => ({
      date: r.day,
      count: Number.parseInt(r.cnt, 10),
    }));
  }
}
