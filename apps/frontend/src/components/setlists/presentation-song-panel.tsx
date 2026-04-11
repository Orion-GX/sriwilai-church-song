"use client";

import type { SetlistSongItem } from "@/lib/api/types";

type PresentationSongPanelProps = {
  song: SetlistSongItem;
  fontScale: number;
  showMetadata: boolean;
  showChords: boolean;
};

export function PresentationSongPanel({
  song,
  fontScale,
  showMetadata,
  showChords,
}: PresentationSongPanelProps) {
  return (
    <section
      className="rounded-3xl bg-card p-5 shadow-soft"
      style={{ fontSize: `${fontScale}rem` }}
    >
      <h3 className="text-2xl font-bold">{song.title}</h3>
      {showMetadata ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {song.artist ?? "Unknown Artist"} • Key {song.selectedKey ?? song.originalKey ?? "-"} •{" "}
          {song.bpm ?? "--"} BPM
        </p>
      ) : null}
      <div className="mt-4 rounded-2xl bg-muted p-4 font-chord text-sm leading-7 text-foreground">
        {showChords ? (
          <>
            <p>[Verse]</p>
            <p>
              {song.selectedKey ?? song.originalKey ?? "C"} | G | Am | F
            </p>
          </>
        ) : null}
        <p className="mt-2">
          Placeholder lyric preview for presentation mode. Replace this with integrated
          chord/lyric renderer.
        </p>
      </div>
      {song.transitionNotes ? (
        <blockquote className="mt-4 rounded-xl bg-secondary-container p-3 text-sm italic text-secondary">
          {song.transitionNotes}
        </blockquote>
      ) : null}
    </section>
  );
}
