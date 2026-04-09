"use client";

import { cn } from "@/lib/utils";

type SongSegmentProps = {
  chord: string | null;
  text: string;
  showChords: boolean;
  fontScale: number;
};

export function SongSegment({
  chord,
  text,
  showChords,
  fontScale,
}: SongSegmentProps) {
  const hasText = text.trim();
  return (
    <span
      className={cn(
        "inline-flex min-w-[3.2rem] flex-col align-top",
        showChords ? "min-w-[3.2rem]" : "min-w-0",
      )}
    >
      {showChords ? (
        <span
          className={cn(
            "h-6 font-semibold leading-6 text-primary",
            !showChords && "opacity-0",
          )}
          style={{ fontSize: `${0.92 * fontScale}rem` }}
        >
          {chord ?? ""}
        </span>
      ) : null}
      <span
        className={cn(
          "whitespace-pre-wrap leading-relaxed text-foreground",
          !text.trim() && "h-6",
        )}
        style={{ fontSize: `${1 * fontScale}rem` }}
      >
        {text || (hasText ? "" : "\u00a0")}
      </span>
    </span>
  );
}
