export type SongCategorySnippet = {
  id: string;
  code: string;
  name: string;
};

export type SongTagSnippet = {
  id: string;
  code: string;
  name: string;
};

/** รายการหมวดจาก GET /app/songs/categories */
export type SongCategoryCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

/** รายการแท็กจาก GET /app/songs/tags */
export type SongTagCatalogItem = {
  id: string;
  code: string;
  name: string;
};

export type SongContentSegment = {
  chord: string | null;
  text_th: string;
  text_en: string;
};

export type SongContentRow = {
  id: string;
  kind: "lyric_with_chords";
  segments: SongContentSegment[];
};

export type SongContentSection = {
  id: string;
  type: "verse" | "chorus" | "bridge" | "other";
  label?: string;
  rows: SongContentRow[];
};

export type SongContentDocument = {
  sections: SongContentSection[];
};

export type SongVersion = {
  id: string;
  songId: string;
  code: "th" | "en" | "custom";
  name: string;
  chordproBody: string;
  contentJson: SongContentDocument | null;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SongListItem = {
  id: string;
  title: string;
  code: string;
  churchId: string | null;
  originalKey: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  tempo: number | null;
  timeSignature: string | null;
  category: SongCategorySnippet | null;
  tags: SongTagSnippet[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SongDetail = SongListItem & {
  chordproBody: string;
  contentJson: SongContentDocument | null;
  versions: SongVersion[];
  originalKey: string | null;
  tempo: number | null;
  timeSignature: string | null;
  coverImageUrl: string | null;
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
  systemRoles?: string[];
  systemPermissions?: string[];
  currentChurchId?: string | null;
  churchMemberships?: Array<{
    churchId: string;
    roleCode: string;
    permissions?: string[];
  }>;
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

export type SetlistPresentationLayout = "vertical" | "horizontal";

export type SetlistSongItem = {
  id: string;
  songId: string;
  title: string;
  artist: string | null;
  originalKey: string | null;
  selectedKey: string | null;
  bpm: number | null;
  order: number;
  transitionNotes: string | null;
  notes: string | null;
  capo: number | null;
  duration: number | null;
  arrangement: string | null;
  version: string | null;
  updatedAt?: string;
};

export type SetlistDetail = {
  id: string;
  ownerUserId?: string;
  title: string;
  description: string | null;
  serviceDate: string | null;
  location: string | null;
  durationMinutes: number | null;
  totalItems: number;
  teamName: string | null;
  isPublic: boolean;
  publicSlug: string | null;
  publicToken?: string | null;
  publicUrl: string | null;
  presentationLayout: SetlistPresentationLayout;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  songs: SetlistSongItem[];
};

export type CreateSetlistSongInput = {
  songId: string;
  title: string;
  artist?: string;
  originalKey?: string;
  selectedKey?: string;
  bpm?: number;
  transitionNotes?: string;
  notes?: string;
  capo?: number;
  duration?: number;
  arrangement?: string;
  version?: string;
};

export type CreateSetlistInput = {
  title: string;
  description?: string;
  serviceDate?: string;
  location?: string;
  durationMinutes?: number;
  teamName?: string;
  isPublic?: boolean;
  presentationLayout?: SetlistPresentationLayout;
  songs?: CreateSetlistSongInput[];
};
