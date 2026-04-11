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

const PROGRESSION_SECTION_LABELS = new Set([
  "Outro",
  "Instrument",
  "Interlude",
  "Solo",
  "Midtro",
]);

export function SongSection({
  section,
  showChords,
  showThai,
  showEnglish,
  fontScale,
}: SongSectionProps) {
  const isProgressionDirective =
    section.type === "other" &&
    !!section.label &&
    PROGRESSION_SECTION_LABELS.has(section.label);

  if (isProgressionDirective) {
    const progressionText = section.rows
      .flatMap((row) => row.segments)
      .map((segment) => segment.text)
      .join("")
      .trim();

    return (
      <section className="mb-5">
        <p className="mb-4 font-mono leading-relaxed">
          <span
            className="font-bold text-primary"
            style={{ fontSize: `${0.92 * fontScale}rem` }}
          >
            {section.label}:
          </span>{" "}
          <span
            className="font-bold text-primary"
            style={{ fontSize: `${0.92 * fontScale}rem` }}
          >
            {progressionText}
          </span>
        </p>
      </section>
    );
  }

  const rowWrapperClassName =
    section.type === "chorus" ? "space-y-0.5 pl-4" : "space-y-0.5";

  return (
    <section className="mb-5">
      {section.label ? (
        <h3
          className="mb-2 text-sm font-bold text-primary"
          data-testid="song-section-label"
          style={{ fontSize: `${0.92 * fontScale}rem` }}
        >
          {section.label}
        </h3>
      ) : null}
      <div className={rowWrapperClassName}>
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
      </div>
    </section>
  );
}
