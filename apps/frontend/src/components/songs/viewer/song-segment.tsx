"use client";

import { cn } from "@/lib/utils";

type SongSegmentProps = {
  chord: string | null;
  text: string;
  appendChordSpace?: boolean;
  showChords: boolean;
  fontScale: number;
};

export function SongSegment({
  chord,
  text,
  appendChordSpace = false,
  showChords,
  fontScale,
}: SongSegmentProps) {
  const hasVisibleText = text.length > 0;
  const filler = !hasVisibleText && !chord ? "\u00a0" : "";
  return (
    <span className="inline-flex flex-col align-top">
      {showChords ? (
        <span
          className={cn(
            "h-6 font-semibold leading-6 text-primary",
            !showChords && "opacity-0",
          )}
          style={{ fontSize: `${0.92 * fontScale}rem` }}
        >
          {chord != null ? `${chord}${appendChordSpace ? "\u00a0" : ""}` : ""}
        </span>
      ) : null}
      <span
        className={cn(
          "whitespace-pre-wrap leading-relaxed text-foreground",
          !hasVisibleText && "h-6",
        )}
        style={{ fontSize: `${1 * fontScale}rem` }}
      >
        {text || filler}
      </span>
    </span>
  );
}
