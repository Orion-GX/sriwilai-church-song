import {
  parseChordPro,
} from "@/lib/chordpro/parse-chordpro";
import {
  transposeChordSymbol,
  transposeChordproText,
} from "@/lib/chordpro/transpose";

export type SongSectionType = "verse" | "chorus" | "bridge" | "other";
export type SongRowKind = "lyric_with_chords";

export type SongContentSegment = {
  chord: string | null;
  text: string;
};

export type SongContentRow = {
  id: string;
  kind: SongRowKind;
  segments: SongContentSegment[];
};

export type SongContentSection = {
  id: string;
  type: SongSectionType;
  label?: string;
  rows: SongContentRow[];
};

export type SongIntro = {
  raw: string;
  display: string;
};

export type SongContentDocument = {
  title?: string;
  intro?: SongIntro;
  sections: SongContentSection[];
};

type SongDetailLike = {
  chordproBody: string;
  contentJson?: unknown;
  versions?: Array<{
    id: string;
    code: "th" | "en" | "custom";
    name: string;
    chordproBody: string;
    contentJson: unknown;
    isDefault: boolean;
    sortOrder: number;
  }>;
};

export type SongDisplayVersion = {
  id: string;
  code: "th" | "en" | "custom";
  name: string;
  isDefault: boolean;
  sortOrder: number;
  chordproBody: string;
  document: SongContentDocument;
};

function parseLineToSegments(line: string): SongContentSegment[] {
  const parts = line.split(/(\[[^\]]+\])/g).filter(Boolean);
  const segments: SongContentSegment[] = [];
  let pendingChord: string | null = null;

  for (const part of parts) {
    const isChord = part.startsWith("[") && part.endsWith("]");
    if (isChord) {
      pendingChord = part.slice(1, -1).trim() || null;
      continue;
    }
    const text = part;
    if (segments.length === 0 && pendingChord == null && text.length > 0) {
      segments.push({ chord: null, text });
    } else if (text.length > 0 || pendingChord != null) {
      segments.push({ chord: pendingChord, text });
    }
    pendingChord = null;
  }

  if (pendingChord != null) {
    segments.push({ chord: pendingChord, text: "" });
  }
  if (segments.length === 0) {
    segments.push({ chord: null, text: "" });
  }
  return segments;
}

export function chordProLineToRow(line: string, rowId: string): SongContentRow {
  return {
    id: rowId,
    kind: "lyric_with_chords",
    segments: parseLineToSegments(line),
  };
}

function normalizeSectionLabel(input: string): string {
  return input.replace(/([A-Za-z])(\d)/g, "$1 $2").trim();
}

function directiveValueToDisplay(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]/g, " $1 ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSectionFromDirective(
  key: string,
  value: string,
): { type: SongSectionType; label: string } | null {
  const trimmedValue = value.trim();
  if (key === "verse") {
    return {
      type: "verse",
      label: trimmedValue ? `Verse ${trimmedValue}` : "Verse",
    };
  }
  if (key === "chorus") {
    return {
      type: "chorus",
      label: trimmedValue ? `Chorus ${trimmedValue}` : "Chorus",
    };
  }
  if (key === "bridge") {
    return {
      type: "bridge",
      label: trimmedValue ? `Bridge ${trimmedValue}` : "Bridge",
    };
  }
  if (key === "tag") {
    return {
      type: "other",
      label: trimmedValue ? `Tag ${trimmedValue}` : "Tag",
    };
  }
  if (key === "comment") {
    const label = normalizeSectionLabel(trimmedValue);
    return {
      type: inferSectionType(label),
      label: label || "Section",
    };
  }
  return null;
}

function inferSectionType(label: string): SongSectionType {
  if (/^chorus\b/i.test(label)) return "chorus";
  if (/^bridge\b/i.test(label)) return "bridge";
  if (/^verse\b/i.test(label)) return "verse";
  return "other";
}

function introRawToDisplay(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]/g, " $1 ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSongContentDocument(value: unknown): value is SongContentDocument {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as SongContentDocument).sections) ||
    (value as SongContentDocument).sections.length === 0
  ) {
    return false;
  }
  return (value as SongContentDocument).sections.every((section) =>
    Array.isArray(section.rows)
      ? section.rows.every((row) =>
          Array.isArray(row.segments)
            ? row.segments.every(
                (segment) =>
                  (segment.chord == null || typeof segment.chord === "string") &&
                  typeof segment.text === "string",
              )
            : false,
        )
      : false,
  );
}

export function chordProToContentDocument(
  chordproBody: string,
): SongContentDocument {
  const blocks = parseChordPro(chordproBody);
  const sections: SongContentSection[] = [];
  let title: string | undefined;
  let intro: SongIntro | undefined;
  let currentSection:
    | {
        type: SongSectionType;
        label?: string;
        rows: SongContentRow[];
      }
    | null = null;
  let sectionCounter = 0;
  let rowCounter = 0;

  const flushCurrentSection = () => {
    if (!currentSection || currentSection.rows.length === 0) {
      currentSection = null;
      return;
    }
    sectionCounter += 1;
    sections.push({
      id: `sec_${sectionCounter}`,
      type: currentSection.type,
      label: currentSection.label,
      rows: currentSection.rows,
    });
    currentSection = null;
  };

  const ensureCurrentSection = () => {
    if (currentSection) return currentSection;
    currentSection = { type: "verse", rows: [] };
    return currentSection;
  };

  const addLyricRow = (line: string) => {
    const section = ensureCurrentSection();
    rowCounter += 1;
    section.rows.push(chordProLineToRow(line, `row_${rowCounter}`));
  };

  for (const block of blocks) {
    if (block.kind === "title") {
      title = block.value.trim();
      continue;
    }

    if (block.kind === "directive" && block.key === "intro") {
      const raw = (block.value ?? "").trim();
      if (raw) {
        intro = { raw, display: introRawToDisplay(raw) };
      }
      continue;
    }

    if (
      block.kind === "directive" &&
      (block.key === "verse" ||
        block.key === "chorus" ||
        block.key === "bridge" ||
        block.key === "tag" ||
        block.key === "comment")
    ) {
      const section = buildSectionFromDirective(block.key, block.value ?? "");
      if (!section) continue;
      flushCurrentSection();
      currentSection = {
        type: section.type,
        label: section.label,
        rows: [],
      };
      continue;
    }

    if (
      block.kind === "directive" &&
      (block.key === "outro" || block.key === "instrument")
    ) {
      const value = (block.value ?? "").trim();
      if (!value) continue;
      flushCurrentSection();
      sectionCounter += 1;
      rowCounter += 1;
      sections.push({
        id: `sec_${sectionCounter}`,
        type: "other",
        label: block.key === "outro" ? "Outro" : "Instrument",
        rows: [
          chordProLineToRow(
            directiveValueToDisplay(value),
            `row_${rowCounter}`,
          ),
        ],
      });
      continue;
    }

    if (block.kind === "lyric") {
      addLyricRow(block.line);
      continue;
    }

    if (block.kind === "chorus") {
      flushCurrentSection();
      sectionCounter += 1;
      const rows = block.lines.map((line) => {
        rowCounter += 1;
        return chordProLineToRow(line, `row_${rowCounter}`);
      });
      sections.push({
        id: `sec_${sectionCounter}`,
        type: "chorus",
        label: block.label?.trim() || "Chorus",
        rows:
          rows.length > 0
            ? rows
            : [chordProLineToRow("", `row_${(rowCounter += 1)}`)],
      });
      continue;
    }

    if (block.kind === "spacer") {
      continue;
    }
  }

  flushCurrentSection();

  if (sections.length === 0) {
    return {
      title,
      intro,
      sections: [
        { id: "sec_1", type: "verse", rows: [chordProLineToRow("", "row_1")] },
      ],
    };
  }
  return { title, intro, sections };
}

export function buildDisplayDocument(
  song: SongDetailLike,
): SongContentDocument {
  if (isSongContentDocument(song.contentJson)) {
    return song.contentJson;
  }
  return chordProToContentDocument(song.chordproBody);
}

export function buildDisplayVersions(
  song: SongDetailLike,
): SongDisplayVersion[] {
  if (song.versions && song.versions.length > 0) {
    return song.versions
      .slice()
      .sort((a, b) => {
        if ((a.isDefault ? 1 : 0) !== (b.isDefault ? 1 : 0)) {
          return (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0);
        }
        return a.sortOrder - b.sortOrder;
      })
      .map((v) => ({
        id: v.id,
        code: v.code,
        name: v.name,
        isDefault: v.isDefault,
        sortOrder: v.sortOrder,
        chordproBody: v.chordproBody,
        document: isSongContentDocument(v.contentJson)
          ? v.contentJson
          : chordProToContentDocument(v.chordproBody),
      }));
  }
  return [
    {
      id: "legacy-default",
      code: "th",
      name: "ไทย",
      isDefault: true,
      sortOrder: 0,
      chordproBody: song.chordproBody,
      document: buildDisplayDocument(song),
    },
  ];
}

export function transposeContentDocument(
  document: SongContentDocument,
  semitones: number,
): SongContentDocument {
  if (semitones === 0) return document;
  const transposedIntroRaw = document.intro
    ? transposeChordproText(document.intro.raw, semitones)
    : null;
  return {
    ...document,
    intro:
      transposedIntroRaw != null
        ? {
            raw: transposedIntroRaw,
            display: introRawToDisplay(transposedIntroRaw),
          }
        : undefined,
    sections: document.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        segments: row.segments.map((segment) => ({
          ...segment,
          chord: segment.chord
            ? transposeChordSymbol(segment.chord, semitones)
            : null,
        })),
      })),
    })),
  };
}
