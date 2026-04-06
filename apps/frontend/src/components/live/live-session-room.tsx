"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Music, Trash2 } from "lucide-react";
import { ChordproView } from "@/components/songs/chordpro-view";
import { FavoriteButton } from "@/components/songs/favorite-button";
import { FollowLeaderToggle } from "@/components/live/follow-leader-toggle";
import { LiveLargeControls } from "@/components/live/live-large-controls";
import { TransposeBar } from "@/components/songs/transpose-bar";
import { Button, buttonClassName } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { endLiveSession, fetchLiveSessionState } from "@/lib/api/live";
import { fetchSongById } from "@/lib/api/songs";
import {
  applySyncToView,
  useLiveSocket,
} from "@/lib/live/use-live-socket";
import { useAuthStore } from "@/lib/stores/auth-store";

type LiveSessionRoomProps = {
  sessionId: string;
};

export function LiveSessionRoom({ sessionId }: LiveSessionRoomProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastVersionRef = React.useRef(0);

  const { data: initial, isLoading, isError, error } = useQuery({
    queryKey: ["liveSession", sessionId],
    queryFn: () => fetchLiveSessionState(sessionId),
    enabled: !!user && !!sessionId,
  });

  const isLeader =
    !!user &&
    !!initial?.session.leaderUserId &&
    user.id === initial.session.leaderUserId;

  const socketEnabled = !!initial && !!user;

  const {
    connected,
    state,
    followingLeader,
    lastBroadcast,
    wsError,
    followLeader,
    unfollowLeader,
    publishSync,
    addSong,
    removeSong,
  } = useLiveSocket(sessionId, isLeader, { enabled: socketEnabled });

  const session = state?.session ?? initial?.session;
  const songs = state?.songs ?? initial?.songs ?? [];

  const [localIndex, setLocalIndex] = React.useState(0);
  const [followerIndex, setFollowerIndex] = React.useState(0);
  const [transpose, setTranspose] = React.useState(0);
  const [addSongId, setAddSongId] = React.useState("");
  const [addErr, setAddErr] = React.useState<string | null>(null);

  const displayIndex = isLeader
    ? localIndex
    : followingLeader
      ? followerIndex
      : localIndex;

  React.useEffect(() => {
    const sync = session?.syncState;
    if (!sync) return;
    const i = sync.songIndex;
    setLocalIndex(i);
    setFollowerIndex(i);
    lastVersionRef.current = sync.pageVersion;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ใช้เฉพาะ pageVersion + id เป็นตัวทริกเกอร์ซิงก์จากเซิร์ฟเวอร์
  }, [session?.syncState?.pageVersion, session?.id]);

  React.useEffect(() => {
    if (!followingLeader || !lastBroadcast?.sync) return;
    const v = lastBroadcast.sync.pageVersion;
    if (v <= lastVersionRef.current) return;
    lastVersionRef.current = v;
    setFollowerIndex(lastBroadcast.sync.songIndex);
    applySyncToView(lastBroadcast.sync, {
      onSongIndex: () => {},
      scrollEl: scrollRef.current,
      applyScroll: true,
    });
  }, [followingLeader, lastBroadcast?.sync?.pageVersion, lastBroadcast?.sync]);

  const currentSongMeta = songs[displayIndex];
  const currentSongId = currentSongMeta?.songId;

  const { data: songDetail } = useQuery({
    queryKey: ["song", currentSongId],
    queryFn: () => fetchSongById(currentSongId!),
    enabled: !!currentSongId,
  });

  const n = songs.length;
  const showNav = isLeader || !followingLeader;

  const goPrev = () => {
    const next = Math.max(0, displayIndex - 1);
    if (isLeader) {
      setLocalIndex(next);
      publishSync({ songIndex: next, scrollRatio: 0 });
    } else {
      setLocalIndex(next);
    }
  };

  const goNext = () => {
    const next = Math.min(Math.max(0, n - 1), displayIndex + 1);
    if (isLeader) {
      setLocalIndex(next);
      publishSync({ songIndex: next, scrollRatio: 0 });
    } else {
      setLocalIndex(next);
    }
  };

  /** ลัดคีย์ pedal-friendly: เพลงถัดไป/ก่อนหน้า (เทียบเท่าปุ่มใหญ่ด้านล่าง) */
  const liveKeyboardNavRef = React.useRef({
    connected,
    showNav,
    n,
    displayIndex,
    goPrev,
    goNext,
  });
  liveKeyboardNavRef.current = {
    connected,
    showNav,
    n,
    displayIndex,
    goPrev,
    goNext,
  };

  React.useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      return t.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const { connected: ok, showNav: nav, n: len, displayIndex: d, goPrev: prev, goNext: next } =
        liveKeyboardNavRef.current;
      if (!ok || !nav || len === 0) return;
      if (isTypingTarget(e.target)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (d < len - 1) {
          e.preventDefault();
          next();
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (d > 0) {
          e.preventDefault();
          prev();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!isLeader || !connected) return;
    const el = scrollRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const max = el.scrollHeight - el.clientHeight;
        const scrollRatio = max > 0 ? el.scrollTop / max : 0;
        publishSync({ songIndex: localIndex, scrollRatio });
      }, 200);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [isLeader, connected, localIndex, publishSync]);

  const endMut = useMutation({
    mutationFn: () => endLiveSession(sessionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["liveSessions"] });
      router.push("/dashboard/live");
    },
  });

  function onAddSong() {
    setAddErr(null);
    const id = addSongId.trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      setAddErr("รูปแบบ UUID ไม่ถูกต้อง");
      return;
    }
    addSong(id);
    setAddSongId("");
  }

  if (!user) {
    return (
      <Card variant="flat">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          กรุณา{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card data-testid="live-room-loading">
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-md" variant="text" />
          <Skeleton className="min-h-[120px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !initial) {
    return (
      <FormErrorBanner data-testid="live-room-error">
        เข้าห้องไม่สำเร็จ:{" "}
        {error instanceof Error ? error.message : String(error)}
      </FormErrorBanner>
    );
  }

  const currentLabel =
    songDetail?.title ?? currentSongMeta?.title ?? "ยังไม่มีเพลงในลิสต์";

  return (
    <div className="space-y-6 pb-36 lg:pb-8" data-testid="live-session-room">
      <span
        data-testid="live-song-index"
        data-index={displayIndex}
        data-total={n}
        className="sr-only"
      >
        เพลงลำดับที่ {displayIndex + 1} จาก {n}
      </span>
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/live"
            className={buttonClassName("ghost", "sm", "mb-1 -ml-2 h-8")}
            data-testid="live-back-list"
          >
            ← รายการห้อง
          </Link>
          <h2 className="text-2xl font-bold" data-testid="live-session-title">
            {session?.title ?? "Live"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {connected ? (
              <span
                className="text-emerald-600 dark:text-emerald-400"
                data-testid="live-ws-status"
                data-state="connected"
              >
                เชื่อมต่อสด
              </span>
            ) : (
              <span data-testid="live-ws-status" data-state="connecting">
                กำลังเชื่อมต่อ…
              </span>
            )}
            {isLeader ? " · คุณคือ leader" : " · โหมดผู้ตาม"}
          </p>
          {wsError ? (
            <FormErrorBanner className="mt-2 text-sm">{wsError}</FormErrorBanner>
          ) : null}
        </div>
        {isLeader ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={endMut.isPending}
              onClick={() => {
                if (confirm("จบเซสชันนี้?")) endMut.mutate();
              }}
            >
              {endMut.isPending ? "กำลังจบ…" : "จบเซสชัน"}
            </Button>
          </div>
        ) : null}
      </div>

      {!isLeader ? (
        <FollowLeaderToggle
          active={followingLeader}
          onFollow={followLeader}
          onUnfollow={unfollowLeader}
          disabled={!connected}
          large
        />
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ลิสต์เพลงในห้อง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <ol className="space-y-2" data-testid="live-song-queue">
          {songs.map((s, idx) => (
            <li
              key={s.liveSongId}
              data-testid={`live-queue-item-${idx}`}
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                idx === displayIndex && "border-primary bg-primary/5",
              )}
            >
              <span>
                {idx + 1}. {s.title}
              </span>
              {isLeader ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="ลบออกจากลิสต์"
                  onClick={() => removeSong(s.liveSongId)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ) : null}
            </li>
          ))}
        </ol>
        {isLeader ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="add-song">เพิ่มเพลง (UUID)</Label>
              <Input
                id="add-song"
                placeholder="วางรหัสเพลงจากหน้ารายการ"
                value={addSongId}
                onChange={(e) => setAddSongId(e.target.value)}
                data-testid="live-add-song-id"
              />
              {addErr ? (
                <FormErrorBanner className="text-xs">{addErr}</FormErrorBanner>
              ) : null}
            </div>
            <Button type="button" onClick={onAddSong} data-testid="live-add-song-submit">
              เพิ่ม
            </Button>
            <Link
              href="/songs"
              className={buttonClassName("outline", "default", "inline-flex h-10 items-center justify-center")}
            >
              ค้นหาเพลง
            </Link>
          </div>
        ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {currentSongId ? (
              <FavoriteButton songId={currentSongId} large />
            ) : null}
            <TransposeBar value={transpose} onChange={setTranspose} large />
          </div>
          {songDetail ? (
            <ChordproView
              body={songDetail.chordproBody}
              transposeSemitones={transpose}
              scrollContainerRef={scrollRef}
              className="max-h-[55vh] min-h-[200px] lg:max-h-[65vh]"
            />
          ) : (
            <EmptyState
              icon={Music}
              title={n === 0 ? "ยังไม่มีเพลง" : "กำลังโหลดเนื้อเพลง…"}
              description={
                n === 0
                  ? "leader เพิ่มเพลงจากรายการ"
                  : "รอสักครู่"
              }
            />
          )}
        </div>
      </div>

      {showNav ? (
        <LiveLargeControls
          currentLabel={currentLabel}
          canPrev={n > 0 && displayIndex > 0}
          canNext={n > 0 && displayIndex < n - 1}
          onPrev={goPrev}
          onNext={goNext}
          disabled={!connected || n === 0}
        />
      ) : (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-muted/90 p-4 text-center text-sm backdrop-blur">
          กำลังตาม leader — ปุ่มเปลี่ยนเพลงถูกซ่อน
        </div>
      )}
    </div>
  );
}
