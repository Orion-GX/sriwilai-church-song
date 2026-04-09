"use client";

import { SongContentSection } from "@/lib/songs/song-content";
import { SongRow } from "./song-row";

type SongSectionProps = {
  section: SongContentSection;
  showChords: boolean;
  showThai: boolean;
  showEnglish: boolean;
  fontScale: number;
};

export function SongSection({
  section,
  showChords,
  showThai,
  showEnglish,
  fontScale,
}: SongSectionProps) {
  return (
    <section className="mb-5">
      {section.label ? (
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
          {section.label}
        </h3>
      ) : null}
      {section.rows.map((row) => (
        <SongRow
          key={row.id}
          row={row}
          showChords={showChords}
          showThai={showThai}
          showEnglish={showEnglish}
          fontScale={fontScale}
        />
      ))}
    </section>
  );
}
