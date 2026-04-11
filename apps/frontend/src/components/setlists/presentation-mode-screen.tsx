"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import type { SetlistDetail } from "@/lib/api/types";

import { PresentationLayoutToggle } from "./presentation-layout-toggle";
import { PresentationReorderDrawer } from "./presentation-reorder-drawer";
import { PresentationSongPanel } from "./presentation-song-panel";

type PresentationModeScreenProps = {
  setlist: SetlistDetail;
  open: boolean;
  layout: "vertical" | "horizontal";
  showMetadata: boolean;
  showChords: boolean;
  fontScale: number;
  onClose: () => void;
  onLayoutChange: (layout: "vertical" | "horizontal") => void;
  onToggleMetadata: () => void;
  onToggleChords: () => void;
  onFontScaleChange: (next: number) => void;
  onReorder: (orderedSongIds: string[]) => void;
};

export function PresentationModeScreen({
  setlist,
  open,
  layout,
  showMetadata,
  showChords,
  fontScale,
  onClose,
  onLayoutChange,
  onToggleMetadata,
  onToggleChords,
  onFontScaleChange,
  onReorder,
}: PresentationModeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const songs = useMemo(
    () => [...setlist.songs].sort((a, b) => a.order - b.order),
    [setlist.songs],
  );

  if (!open) return null;

  const moveSong = (fromIndex: number, toIndex: number) => {
    const copy = [...songs];
    const [picked] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, picked);
    onReorder(copy.map((song) => song.id));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background p-4">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
            Presentation mode
          </p>
          <h2 className="text-2xl font-semibold">{setlist.title}</h2>
        </div>
        <button
          type="button"
          className="rounded-xl bg-muted p-2"
          aria-label="Close presentation mode"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center gap-2 rounded-2xl bg-card p-3">
        <PresentationLayoutToggle value={layout} onChange={onLayoutChange} />
        <button
          type="button"
          onClick={onToggleMetadata}
          className="rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold"
        >
          {showMetadata ? "Hide metadata" : "Show metadata"}
        </button>
        <button
          type="button"
          onClick={onToggleChords}
          className="rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold"
        >
          {showChords ? "Hide chords" : "Show chords"}
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs font-semibold">
          Font
          <input
            type="range"
            min={0.8}
            max={1.5}
            step={0.1}
            value={fontScale}
            onChange={(e) => onFontScaleChange(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row">
        <PresentationReorderDrawer songs={songs} onMove={moveSong} />
        <main className="min-w-0 flex-1">
          {layout === "vertical" ? (
            <div className="space-y-3">
              {songs.map((song) => (
                <PresentationSongPanel
                  key={song.id}
                  song={song}
                  fontScale={fontScale}
                  showMetadata={showMetadata}
                  showChords={showChords}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {songs.map((song, idx) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                      idx === currentIndex ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              {songs[currentIndex] ? (
                <PresentationSongPanel
                  song={songs[currentIndex]}
                  fontScale={fontScale}
                  showMetadata={showMetadata}
                  showChords={showChords}
                />
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
