"use client";

import { SongContentRow } from "@/lib/songs/song-content";
import { SongSegment } from "./song-segment";

type SongRowProps = {
  row: SongContentRow;
  showChords: boolean;
  showThai: boolean;
  showEnglish: boolean;
  fontScale: number;
};

export function SongRow({ row, showChords, fontScale }: SongRowProps) {
  return (
    <div className="mb-2 flex flex-wrap gap-0">
      {row.segments.map((segment, index) => (
        <SongSegment
          key={`${row.id}-${index}`}
          chord={segment.chord}
          text={segment.text}
          appendChordSpace={
            segment.chord != null &&
            segment.text.length === 0 &&
            row.segments[index + 1]?.chord != null
          }
          showChords={showChords}
          fontScale={fontScale}
        />
      ))}
    </div>
  );
}
