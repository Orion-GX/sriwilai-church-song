export class AdminSongDailyCountDto {
  date!: string;
  count!: number;
}

export class AdminTopSongDto {
  id!: string;
  title!: string;
  slug!: string;
  viewCount!: number;
}

export class AdminLiveSessionSummaryDto {
  id!: string;
  title!: string;
  status!: string;
  leaderUserId!: string;
  createdAt!: string;
}

export class AdminDashboardDto {
  songsTotal!: number;
  songsNewLast7Days!: number;
  songsNewLast30Days!: number;
  songsCreatedByDay!: AdminSongDailyCountDto[];
  topViewedSongs!: AdminTopSongDto[];
  usersTotal!: number;
  usersNewLast7Days!: number;
  liveActiveSessions!: number;
  liveSessionsTotal!: number;
  liveRecentSessions!: AdminLiveSessionSummaryDto[];
}
