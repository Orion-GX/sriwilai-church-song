export type SongCategorySnippet = {
  id: string;
  slug: string;
  name: string;
};

export type SongTagSnippet = {
  id: string;
  slug: string;
  name: string;
};

export type SongListItem = {
  id: string;
  title: string;
  slug: string;
  churchId: string | null;
  isPublished: boolean;
  category: SongCategorySnippet | null;
  tags: SongTagSnippet[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SongDetail = SongListItem & {
  chordproBody: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type PaginatedSongs = {
  items: SongListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: AuthUser;
};

export type LiveSyncState = {
  songIndex: number;
  sectionLabel?: string | null;
  lineIndex?: number | null;
  charOffset?: number | null;
  scrollRatio?: number | null;
  meta?: Record<string, unknown>;
  pageVersion: number;
  updatedAt: string;
};

export type LiveSessionRow = {
  id: string;
  title: string;
  status: string;
  leaderUserId: string;
  churchId: string | null;
  syncState: LiveSyncState | null;
  createdAt: string;
};

export type LiveSessionSongRow = {
  liveSongId: string;
  songId: string;
  sortOrder: number;
  title: string;
  slug: string;
};

export type LiveSessionStatePayload = {
  v: number;
  session: LiveSessionRow;
  songs: LiveSessionSongRow[];
};

export type LiveSongsUpdatedPayload = {
  v: number;
  sessionId: string;
  songs: LiveSessionSongRow[];
};

export type LiveSyncBroadcastPayload = {
  v: number;
  sessionId: string;
  sync: LiveSyncState;
  emittedByUserId: string;
};

export type LiveFollowStatePayload = {
  v: number;
  sessionId: string;
  followingLeader: boolean;
};

export type LiveJoinedPayload = {
  v: number;
  sessionId: string;
  participantMode: "leader" | "follower";
  room: string;
  followingLeader: boolean;
};

export type LiveErrorPayload = {
  v: number;
  code: string;
  message: string;
  details?: unknown;
};
