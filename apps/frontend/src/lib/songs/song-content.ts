import {
  parseChordPro,
  type ChordProBlock,
} from "@/lib/chordpro/parse-chordpro";
import { transposeChordSymbol } from "@/lib/chordpro/transpose";

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

export type SongContentDocument = {
  sections: SongContentSection[];
};

type SongDetailLike = {
  chordproBody: string;
  contentJson?: SongContentDocument | null;
  versions?: Array<{
    id: string;
    code: "th" | "en" | "custom";
    name: string;
    chordproBody: string;
    contentJson: SongContentDocument | null;
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

function blockToSection(
  block: ChordProBlock,
  index: number,
): SongContentSection | null {
  if (block.kind === "spacer") {
    return null;
  }
  if (block.kind === "chorus") {
    const rows = block.lines.map((line, rowIndex) =>
      chordProLineToRow(line, `row_${index + 1}_${rowIndex + 1}`),
    );
    return {
      id: `sec_${index + 1}`,
      type: "chorus",
      label: block.label?.trim() || "Chorus",
      rows:
        rows.length > 0 ? rows : [chordProLineToRow("", `row_${index + 1}_1`)],
    };
  }
  if (block.kind === "lyric") {
    return {
      id: `sec_${index + 1}`,
      type: "verse",
      rows: [chordProLineToRow(block.line, `row_${index + 1}_1`)],
    };
  }
  if (
    block.kind === "title" ||
    block.kind === "subtitle" ||
    block.kind === "directive"
  ) {
    const text =
      block.kind === "directive"
        ? `[${block.key}]${block.value ? ` ${block.value}` : ""}`
        : block.value;
    return {
      id: `sec_${index + 1}`,
      type: "other",
      label:
        block.kind === "title"
          ? "Title"
          : block.kind === "subtitle"
            ? "Subtitle"
            : "Directive",
      rows: [chordProLineToRow(text, `row_${index + 1}_1`)],
    };
  }
  return null;
}

export function chordProToContentDocument(
  chordproBody: string,
): SongContentDocument {
  const blocks = parseChordPro(chordproBody);
  const sections = blocks
    .map((block, index) => blockToSection(block, index))
    .filter((x): x is SongContentSection => x != null);
  if (sections.length === 0) {
    return {
      sections: [
        { id: "sec_1", type: "verse", rows: [chordProLineToRow("", "row_1")] },
      ],
    };
  }
  return { sections };
}

export function buildDisplayDocument(
  song: SongDetailLike,
): SongContentDocument {
  if (
    song.contentJson &&
    Array.isArray(song.contentJson.sections) &&
    song.contentJson.sections.length > 0
  ) {
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
        document:
          v.contentJson &&
          Array.isArray(v.contentJson.sections) &&
          v.contentJson.sections.length > 0
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
  return {
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
