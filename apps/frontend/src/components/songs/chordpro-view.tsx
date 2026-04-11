"use client";

import { parseChordPro } from "@/lib/chordpro/parse-chordpro";
import { transposeChordproText } from "@/lib/chordpro/transpose";
import { cn } from "@/lib/utils";
import * as React from "react";

type ChordproViewProps = {
  body: string;
  transposeSemitones?: number;
  className?: string;
  /** ref ถึงคอนเทนเนอร์เลื่อน (ใช้กับ live sync) */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
};

const PROGRESSION_DIRECTIVE_LEADS: Record<string, string> = {
  intro: "Intro",
  outro: "Outro",
  instrument: "Instrument",
  interlude: "Interlude",
  solo: "Solo",
  midtro: "Midtro",
};

/**
 * เรนเดอร์ ChordPro: directive, ท่อนฮุค {start_of_chorus}…{end_of_chorus}, คอร์ดใน []
 */
export function ChordproView({
  body,
  transposeSemitones = 0,
  className,
  scrollContainerRef,
}: ChordproViewProps) {
  const blocks = React.useMemo(() => {
    const text = transposeChordproText(body, transposeSemitones);
    return parseChordPro(text);
  }, [body, transposeSemitones]);

  return (
    <div
      ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
      data-testid="chordpro-view"
      className={cn(
        "rounded-lg border bg-card p-4 text-base leading-relaxed",
        scrollContainerRef
          ? "max-h-[70vh] overflow-y-auto"
          : "max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-visible",
        className,
      )}
    >
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "spacer":
            return <div key={i} className="h-3" />;
          case "lyric":
            return <LyricLine key={i} line={block.line} />;
          case "title":
            return (
              <h2
                key={i}
                className="mb-3 text-xl font-bold text-foreground md:text-2xl"
              >
                {block.value}
              </h2>
            );
          case "subtitle":
            return (
              <p key={i} className="mb-2 text-sm text-muted-foreground">
                {block.value}
              </p>
            );
          case "directive":
            if (
              block.key === "comment" ||
              block.key === "verse" ||
              block.key === "chorus" ||
              block.key === "bridge" ||
              block.key === "tag"
            ) {
              const label = sectionLabelFromDirective(block.key, block.value);
              return (
                <h3
                  key={i}
                  className="mb-2 mt-4 text-sm font-bold text-primary"
                >
                  {label}
                </h3>
              );
            }
            if (block.key in PROGRESSION_DIRECTIVE_LEADS) {
              const lead = PROGRESSION_DIRECTIVE_LEADS[block.key];
              return (
                <p key={i} className="mb-3 font-mono leading-relaxed ">
                  <span className="font-bold text-primary">{lead}:</span>{" "}
                  <span className="font-bold text-primary">
                    {introRawToDisplay(block.value ?? "")}
                  </span>
                </p>
              );
            }
            return (
              <p
                key={i}
                className="mb-2 font-medium uppercase tracking-wide text-primary"
              >
                [{block.key}]
                {block.value != null && block.value !== ""
                  ? ` ${block.value}`
                  : ""}
              </p>
            );
          case "chorus":
            return (
              <div
                key={i}
                className="my-4 rounded-r-md border-l-4 border-primary bg-primary/5 py-3 pl-4 pr-2"
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  {block.label?.trim() ? block.label : "ท่อนฮุค (Chorus)"}
                </p>
                <div className="space-y-0">
                  {block.lines.map((line, j) =>
                    line === "" ? (
                      <div key={j} className="h-2" />
                    ) : (
                      <LyricLine key={j} line={line} />
                    ),
                  )}
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

function normalizeSectionLabel(input: string): string {
  return input.replace(/([A-Za-z])(\d)/g, "$1 $2").trim();
}

function sectionLabelFromDirective(key: string, value?: string): string {
  const trimmed = (value ?? "").trim();
  if (key === "verse") return trimmed ? `Verse ${trimmed}` : "Verse";
  if (key === "chorus") return trimmed ? `Chorus ${trimmed}` : "Chorus";
  if (key === "bridge") return trimmed ? `Bridge ${trimmed}` : "Bridge";
  if (key === "tag") return trimmed ? `Tag ${trimmed}` : "Tag";
  return normalizeSectionLabel(trimmed);
}

function introRawToDisplay(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]/g, " $1 ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

function LyricLine({ line }: { line: string }) {
  const normalizedLine = line.replace(/\]\[/g, "] [");
  const parts = normalizedLine.split(/(\[[^\]]+\])/g);
  return (
    <p className="mb-1 font-mono text-[0.95rem] md:text-base">
      {parts.map((part, j) => {
        if (part.startsWith("[") && part.endsWith("]")) {
          return (
            <span key={j} className="mr-[0.15em] font-semibold text-primary">
              {part}
            </span>
          );
        }
        return (
          <span key={j} className="text-foreground">
            {part}
          </span>
        );
      })}
    </p>
  );
}
