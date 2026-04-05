import { apiFetch } from "@/lib/api/client";

export type AdminSongDailyCount = {
  date: string;
  count: number;
};

export type AdminTopSong = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
};

export type AdminLiveSessionSummary = {
  id: string;
  title: string;
  status: string;
  leaderUserId: string;
  createdAt: string;
};

export type AdminDashboard = {
  songsTotal: number;
  songsNewLast7Days: number;
  songsNewLast30Days: number;
  songsCreatedByDay: AdminSongDailyCount[];
  topViewedSongs: AdminTopSong[];
  usersTotal: number;
  usersNewLast7Days: number;
  liveActiveSessions: number;
  liveSessionsTotal: number;
  liveRecentSessions: AdminLiveSessionSummary[];
};

export function fetchAdminDashboard(): Promise<AdminDashboard> {
  return apiFetch<AdminDashboard>("/app/admin/dashboard");
}
