"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getWsOrigin } from "@/lib/api/env";
import type {
  LiveErrorPayload,
  LiveFollowStatePayload,
  LiveSessionStatePayload,
  LiveSongsUpdatedPayload,
  LiveSyncBroadcastPayload,
  LiveSyncState,
} from "@/lib/api/types";
import { LIVE_CLIENT_EVENTS, LIVE_SERVER_EVENTS } from "@/lib/live/constants";
import { useAuthStore } from "@/lib/stores/auth-store";

export type LiveSyncPageInput = {
  songIndex: number;
  sectionLabel?: string | null;
  lineIndex?: number | null;
  charOffset?: number | null;
  scrollRatio?: number | null;
  meta?: Record<string, unknown>;
};

type UseLiveSocketOptions = {
  /** รอข้อมูลจาก REST ก่อนค่อย join (เพื่อเลือก leader/follower) */
  enabled?: boolean;
};

export function useLiveSocket(
  sessionId: string | null,
  isLeader: boolean,
  options: UseLiveSocketOptions = {},
) {
  const { enabled = true } = options;
  const accessToken = useAuthStore((s) => s.accessToken);

  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<LiveSessionStatePayload | null>(null);
  const [followingLeader, setFollowingLeader] = useState(false);
  const [lastBroadcast, setLastBroadcast] =
    useState<LiveSyncBroadcastPayload | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const participantMode = isLeader ? "leader" : "follower";

  useEffect(() => {
    if (!enabled || !sessionId || !accessToken) {
      return;
    }

    setWsError(null);
    setLastBroadcast(null);

    const token = accessToken.startsWith("Bearer")
      ? accessToken
      : `Bearer ${accessToken}`;

    const socket = io(`${getWsOrigin()}/live`, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      socket.emit(LIVE_CLIENT_EVENTS.JOIN, {
        sessionId,
        participantMode,
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", () => setConnected(false));

    socket.on(
      LIVE_SERVER_EVENTS.SESSION_STATE,
      (payload: LiveSessionStatePayload) => {
        setState(payload);
      },
    );

    socket.on(
      LIVE_SERVER_EVENTS.SONGS_UPDATED,
      (payload: LiveSongsUpdatedPayload) => {
        setState((prev) =>
          prev && prev.session.id === payload.sessionId
            ? { ...prev, songs: payload.songs, v: payload.v }
            : prev,
        );
      },
    );

    socket.on(
      LIVE_SERVER_EVENTS.SYNC_BROADCAST,
      (payload: LiveSyncBroadcastPayload) => {
        if (payload.sessionId === sessionId) {
          setLastBroadcast(payload);
        }
      },
    );

    socket.on(
      LIVE_SERVER_EVENTS.FOLLOW_STATE,
      (payload: LiveFollowStatePayload) => {
        if (payload.sessionId === sessionId) {
          setFollowingLeader(payload.followingLeader);
        }
      },
    );

    socket.on(LIVE_SERVER_EVENTS.JOINED, () => {
      setFollowingLeader(false);
    });

    socket.on(LIVE_SERVER_EVENTS.ERROR, (payload: LiveErrorPayload) => {
      setWsError(payload.message);
    });

    return () => {
      socket.emit(LIVE_CLIENT_EVENTS.LEAVE, { sessionId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, sessionId, accessToken, participantMode]);

  const followLeader = useCallback(() => {
    if (!sessionId) return;
    socketRef.current?.emit(LIVE_CLIENT_EVENTS.FOLLOW_LEADER, { sessionId });
  }, [sessionId]);

  const unfollowLeader = useCallback(() => {
    if (!sessionId) return;
    socketRef.current?.emit(LIVE_CLIENT_EVENTS.UNFOLLOW, { sessionId });
  }, [sessionId]);

  const publishSync = useCallback(
    (page: LiveSyncPageInput) => {
      if (!sessionId) return;
      socketRef.current?.emit(LIVE_CLIENT_EVENTS.SYNC_PAGE, {
        sessionId,
        page: {
          songIndex: page.songIndex,
          sectionLabel: page.sectionLabel,
          lineIndex: page.lineIndex,
          charOffset: page.charOffset,
          scrollRatio: page.scrollRatio,
          meta: page.meta,
        },
      });
    },
    [sessionId],
  );

  const requestSync = useCallback(() => {
    if (!sessionId) return;
    socketRef.current?.emit(LIVE_CLIENT_EVENTS.SYNC_REQUEST, { sessionId });
  }, [sessionId]);

  const addSong = useCallback(
    (songId: string, position?: number) => {
      if (!sessionId) return;
      socketRef.current?.emit(LIVE_CLIENT_EVENTS.SONGS_ADD, {
        sessionId,
        songId,
        position,
      });
    },
    [sessionId],
  );

  const removeSong = useCallback(
    (liveSongId: string) => {
      if (!sessionId) return;
      socketRef.current?.emit(LIVE_CLIENT_EVENTS.SONGS_REMOVE, {
        sessionId,
        liveSongId,
      });
    },
    [sessionId],
  );

  return {
    connected,
    state,
    followingLeader,
    lastBroadcast,
    wsError,
    followLeader,
    unfollowLeader,
    publishSync,
    requestSync,
    addSong,
    removeSong,
  };
}

/** นำสถานะ sync จาก leader ไปใช้กับ UI (index / scroll) */
export function applySyncToView(
  sync: LiveSyncState,
  opts: {
    onSongIndex: (i: number) => void;
    scrollEl: HTMLElement | null;
    /** ถ้า true จะเลื่อนตาม scrollRatio */
    applyScroll: boolean;
  },
) {
  opts.onSongIndex(sync.songIndex);
  if (opts.applyScroll && opts.scrollEl != null && sync.scrollRatio != null) {
    const el = opts.scrollEl;
    const max = el.scrollHeight - el.clientHeight;
    if (max > 0) {
      el.scrollTop = sync.scrollRatio * max;
    }
  }
}
