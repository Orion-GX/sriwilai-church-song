"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  addSetlistSong,
  deleteSetlistSong,
  updateSetlistSong,
} from "@/lib/api/setlists";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGuestSetlistsStore } from "@/lib/stores/setlists-guest-store";
import {
  setlistQueryKeys,
  usePresentationMode,
  usePublicSetlistAccess,
  useSetlistDetail,
  useSongKeyChange,
  useSongReorder,
} from "@/lib/setlists";

import { AddSongToSetCard } from "./add-song-to-set-card";
import { PresentationModeButton } from "./presentation-mode-button";
import { PresentationModeScreen } from "./presentation-mode-screen";
import { SetMetadataPanel } from "./set-metadata-panel";
import { SetlistBottomNavigation } from "./setlist-bottom-navigation";
import { SetlistHeader } from "./setlist-header";
import { SetlistHero } from "./setlist-hero";
import { SetlistSongList } from "./setlist-song-list";

type SetlistBuilderScreenProps = {
  setlistId: string;
};

export function SetlistBuilderScreen({ setlistId }: SetlistBuilderScreenProps) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const saveGuestSetlist = useGuestSetlistsStore((s) => s.saveGuestSetlist);
  const [deleteFeedback, setDeleteFeedback] = React.useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const detailQuery = useSetlistDetail(setlistId);
  const reorderMutation = useSongReorder(setlistId);
  const keyMutation = useSongKeyChange(setlistId);
  const publicAccess = usePublicSetlistAccess(setlistId);
  const presentation = usePresentationMode(
    detailQuery.data?.presentationLayout ?? "vertical",
  );

  const transitionMutation = useMutation({
    mutationFn: async (input: { itemId: string; notes: string }) => {
      if (!detailQuery.data) {
        throw new Error("Setlist not found");
      }
      if (!accessToken || setlistId.startsWith("guest-")) {
        return saveGuestSetlist({
          ...detailQuery.data,
          songs: detailQuery.data.songs.map((song) =>
            song.id === input.itemId
              ? { ...song, transitionNotes: input.notes }
              : song,
          ),
        });
      }
      return updateSetlistSong(setlistId, input.itemId, {
        transitionNotes: input.notes,
      });
    },
    onSuccess: (next) => {
      queryClient.setQueryData(setlistQueryKeys.detail(setlistId), next);
    },
  });

  const deleteSongMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!detailQuery.data) {
        throw new Error("Setlist not found");
      }
      if (!accessToken || setlistId.startsWith("guest-")) {
        const songs = detailQuery.data.songs
          .filter((song) => song.id !== itemId)
          .sort((a, b) => a.order - b.order)
          .map((song, order) => ({ ...song, order }));
        return saveGuestSetlist({
          ...detailQuery.data,
          songs,
          totalItems: songs.length,
        });
      }
      return deleteSetlistSong(setlistId, itemId);
    },
    onSuccess: (next) => {
      queryClient.setQueryData(setlistQueryKeys.detail(setlistId), next);
      setDeleteFeedback({
        kind: "success",
        message: "ลบเพลงออกจาก setlist แล้ว",
      });
    },
    onError: () => {
      setDeleteFeedback({
        kind: "error",
        message: "ลบเพลงไม่สำเร็จ กรุณาลองใหม่",
      });
    },
  });

  React.useEffect(() => {
    if (!deleteFeedback) return;
    const timer = window.setTimeout(() => setDeleteFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [deleteFeedback]);

  const addSongMutation = useMutation({
    mutationFn: async (song: (NonNullable<typeof detailQuery.data>)["songs"][number]) => {
      if (!detailQuery.data) throw new Error("Setlist not found");
      if (accessToken && !setlistId.startsWith("guest-")) {
        return addSetlistSong(setlistId, {
          songId: song.songId,
          title: song.title,
          artist: song.artist ?? undefined,
          originalKey: song.originalKey ?? undefined,
          selectedKey: song.selectedKey ?? undefined,
          bpm: song.bpm ?? undefined,
          transitionNotes: song.transitionNotes ?? undefined,
          notes: song.notes ?? undefined,
          capo: song.capo ?? undefined,
          duration: song.duration ?? undefined,
          arrangement: song.arrangement ?? undefined,
          version: song.version ?? undefined,
        });
      }
      const songs = [
        ...detailQuery.data.songs,
        {
          ...song,
          order: detailQuery.data.songs.length,
        },
      ];
      const next = { ...detailQuery.data, songs, totalItems: songs.length };
      return saveGuestSetlist(next);
    },
    onSuccess: (next) => {
      queryClient.setQueryData(setlistQueryKeys.detail(setlistId), next);
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading setlist...
      </div>
    );
  }
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground">
        Unable to load this setlist.
      </div>
    );
  }

  const setlist = detailQuery.data;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24 lg:max-w-5xl lg:px-6">
      <SetlistHeader />
      <SetlistHero setlist={setlist} />
      <PresentationModeButton onClick={presentation.open} />

      <SetlistSongList
        songs={setlist.songs}
        onReorder={(ids) => reorderMutation.mutate(ids)}
        onChangeKey={(itemId, key) =>
          keyMutation.mutate({ itemId, selectedKey: key })
        }
        onSaveTransitionNotes={(itemId, notes) =>
          transitionMutation.mutate({ itemId, notes })
        }
        onDeleteSong={(itemId) => {
          const song = setlist.songs.find((row) => row.id === itemId);
          const label = song ? `\"${song.title}\"` : "เพลงนี้";
          if (!window.confirm(`ลบ ${label} ออกจาก setlist ใช่หรือไม่?`)) return;
          deleteSongMutation.mutate(itemId);
        }}
      />

      <AddSongToSetCard onAddSong={(song) => addSongMutation.mutate(song)} />

      <SetMetadataPanel
        setlist={setlist}
        onTogglePublic={(next) => publicAccess.setVisibility.mutate(next)}
        onGeneratePublicLink={() => publicAccess.generatePublicLink.mutate()}
      />

      <SetlistBottomNavigation active="setlists" />

      <PresentationModeScreen
        open={presentation.isOpen}
        setlist={setlist}
        layout={presentation.layout}
        showMetadata={presentation.showMetadata}
        showChords={presentation.showChords}
        fontScale={presentation.fontScale}
        onClose={presentation.close}
        onLayoutChange={(layout) => {
          presentation.setLayout(layout);
          publicAccess.setPresentationLayout.mutate(layout);
        }}
        onToggleMetadata={presentation.toggleMetadata}
        onToggleChords={presentation.toggleChords}
        onFontScaleChange={presentation.setFontScale}
        onReorder={(ids) => reorderMutation.mutate(ids)}
      />

      {deleteFeedback ? (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
          <div
            className={
              deleteFeedback.kind === "success"
                ? "rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-elevated"
                : "rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-elevated"
            }
            role="status"
            aria-live="polite"
            data-testid="setlist-delete-feedback"
          >
            {deleteFeedback.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
