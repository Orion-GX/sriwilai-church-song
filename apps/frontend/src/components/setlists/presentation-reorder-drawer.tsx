"use client";

import { GripVertical } from "lucide-react";

import type { SetlistSongItem } from "@/lib/api/types";

type PresentationReorderDrawerProps = {
  songs: SetlistSongItem[];
  onMove: (fromIndex: number, toIndex: number) => void;
};

export function PresentationReorderDrawer({
  songs,
  onMove,
}: PresentationReorderDrawerProps) {
  return (
    <aside className="w-full space-y-2 rounded-2xl bg-muted p-3 lg:w-72">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Reorder songs
      </p>
      {songs.map((song, idx) => (
        <div
          key={song.id}
          className="flex items-center justify-between rounded-xl bg-card px-3 py-2"
        >
          <span className="truncate text-sm font-medium">{song.title}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs hover:bg-muted"
              disabled={idx === 0}
              onClick={() => onMove(idx, idx - 1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs hover:bg-muted"
              disabled={idx === songs.length - 1}
              onClick={() => onMove(idx, idx + 1)}
            >
              ↓
            </button>
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      ))}
    </aside>
  );
}
