"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { createSetlist } from "@/lib/api/setlists";
import { setlistQueryKeys } from "@/lib/setlists";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGuestSetlistsStore } from "@/lib/stores/setlists-guest-store";

/**
 * เมื่อผู้ใช้ล็อกอิน จะย้าย guest setlists เข้า database และล้าง local cache อัตโนมัติ
 */
export function SetlistsBootstrap() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestSetlists = useGuestSetlistsStore((s) => s.guestSetlists);
  const removeGuestSetlist = useGuestSetlistsStore((s) => s.removeGuestSetlist);
  const lastMigratedTokenRef = React.useRef<string | null>(null);
  const [migrationNotice, setMigrationNotice] = React.useState<{
    kind: "success" | "warning";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (!migrationNotice) return;
    const timer = window.setTimeout(() => setMigrationNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [migrationNotice]);

  React.useEffect(() => {
    if (!accessToken) {
      lastMigratedTokenRef.current = null;
      return;
    }
    if (lastMigratedTokenRef.current === accessToken) return;
    if (guestSetlists.length === 0) {
      lastMigratedTokenRef.current = accessToken;
      return;
    }

    let cancelled = false;
    void (async () => {
      const migrationResults = await Promise.allSettled(
        guestSetlists.map((setlist) =>
          createSetlist({
            title: setlist.title,
            description: setlist.description ?? undefined,
            serviceDate: setlist.serviceDate ?? undefined,
            location: setlist.location ?? undefined,
            durationMinutes: setlist.durationMinutes ?? undefined,
            teamName: setlist.teamName ?? undefined,
            isPublic: false,
            presentationLayout: setlist.presentationLayout,
            songs: [...setlist.songs]
              .sort((a, b) => a.order - b.order)
              .map((song) => ({
                songId: song.songId,
                title: song.title,
                artist: song.artist ?? undefined,
                originalKey: song.originalKey ?? undefined,
                selectedKey: song.selectedKey ?? undefined,
                bpm: song.tempo ?? undefined,
                transitionNotes: song.transitionNotes ?? undefined,
                notes: song.notes ?? undefined,
                capo: song.capo ?? undefined,
                duration: song.duration ?? undefined,
                arrangement: song.arrangement ?? undefined,
                version: song.version ?? undefined,
              })),
          }),
        ),
      );
      if (cancelled) return;

      const successIndices: number[] = [];
      const failedIndices: number[] = [];
      migrationResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successIndices.push(index);
        } else {
          failedIndices.push(index);
        }
      });

      for (const index of successIndices) {
        removeGuestSetlist(guestSetlists[index].id);
      }
      lastMigratedTokenRef.current = accessToken;
      queryClient.invalidateQueries({ queryKey: setlistQueryKeys.list() });

      if (failedIndices.length === 0) {
        setMigrationNotice({
          kind: "success",
          message: `ย้ายเซ็ตลิสต์จากเครื่องเข้า account สำเร็จ ${successIndices.length} รายการ`,
        });
        return;
      }
      setMigrationNotice({
        kind: "warning",
        message: `ย้ายเข้า account สำเร็จ ${successIndices.length} รายการ และยังค้างในเครื่อง ${failedIndices.length} รายการ`,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, guestSetlists, queryClient, removeGuestSetlist]);

  if (!migrationNotice) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-4">
      <div
        className={
          migrationNotice.kind === "success"
            ? "rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-elevated"
            : "rounded-lg bg-amber-500 px-4 py-2 text-sm text-black shadow-elevated"
        }
        role="status"
        aria-live="polite"
        data-testid="setlist-migration-notice"
      >
        {migrationNotice.message}
      </div>
    </div>
  );
}
