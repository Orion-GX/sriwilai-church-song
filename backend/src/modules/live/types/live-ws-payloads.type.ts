import { LIVE_PAYLOAD_VERSION } from '../constants/live.events';
import type { LiveSyncState } from './live-sync-state.type';

export interface LiveWsEnvelope {
  v: typeof LIVE_PAYLOAD_VERSION;
}

export interface LiveJoinedServerPayload extends LiveWsEnvelope {
  sessionId: string;
  participantMode: 'leader' | 'follower';
  room: string;
  /** อยู่ใน followers room หรือไม่ */
  followingLeader: boolean;
}

export interface LiveSessionRowPayload {
  id: string;
  title: string;
  status: string;
  leaderUserId: string;
  churchId: string | null;
  syncState: LiveSyncState | null;
  createdAt: string;
}

export interface LiveSessionSongRowPayload {
  liveSongId: string;
  songId: string;
  sortOrder: number;
  title: string;
  slug: string;
}

export interface LiveSessionStateServerPayload extends LiveWsEnvelope {
  session: LiveSessionRowPayload;
  songs: LiveSessionSongRowPayload[];
}

export interface LiveSongsUpdatedServerPayload extends LiveWsEnvelope {
  sessionId: string;
  songs: LiveSessionSongRowPayload[];
}

export interface LiveSyncBroadcastServerPayload extends LiveWsEnvelope {
  sessionId: string;
  sync: LiveSyncState;
  emittedByUserId: string;
}

export interface LiveFollowStateServerPayload extends LiveWsEnvelope {
  sessionId: string;
  followingLeader: boolean;
}

export interface LiveErrorServerPayload extends LiveWsEnvelope {
  code: string;
  message: string;
  details?: unknown;
}
