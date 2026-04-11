"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchSongList } from "@/lib/api/songs";
import type { SetlistSongItem } from "@/lib/api/types";

type AddSongToSetCardProps = {
  onAddSong: (song: SetlistSongItem) => void;
};

export function AddSongToSetCard({ onAddSong }: AddSongToSetCardProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const songsQuery = useQuery({
    queryKey: ["song-library", query],
    queryFn: () => fetchSongList({ q: query || undefined, limit: 12 }),
  });

  const songs = useMemo(() => songsQuery.data?.items ?? [], [songsQuery.data?.items]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-4 mt-4 flex h-32 w-[calc(100%-2rem)] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card text-muted-foreground transition hover:bg-muted"
      >
        <Plus className="h-6 w-6" />
        <span className="mt-2 text-base font-semibold">Add Song to Set</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/30 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-12 max-w-md rounded-3xl bg-card p-4 shadow-elevated">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Song</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs..."
              className="mb-3 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20"
            />
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {songs.map((song) => (
                <button
                  type="button"
                  key={song.id}
                  onClick={() => {
                    onAddSong({
                      id: `set-item-${crypto.randomUUID()}`,
                      songId: song.id,
                      title: song.title,
                      artist: null,
                      originalKey: song.originalKey,
                      selectedKey: song.originalKey,
                      bpm: null,
                      order: 0,
                      transitionNotes: null,
                      notes: null,
                      capo: null,
                      duration: null,
                      arrangement: null,
                      version: null,
                    });
                    setOpen(false);
                  }}
                  className="w-full rounded-xl bg-muted p-3 text-left transition hover:bg-secondary-container"
                >
                  <p className="font-semibold">{song.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Key {song.originalKey ?? "-"}
                  </p>
                </button>
              ))}
              {songsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading songs...</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
