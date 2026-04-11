const CHORD_SYMBOL_RE =
  /^[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug)?(?:\d+)?(?:[#b]?\d+)?(?:\/[A-G](?:#|b)?)?$/;

type ChordHit = {
  chord: string;
  index: number;
};

const COMMENT_SECTION_LABELS = [
  "Chorus",
  "Pre-Chorus",
  "Bridge",
  "Outro",
  "Tag",
] as const;

const LYRIC_PREFIX_RE = /^(\s*(?:\d+|[A-Za-z])\s*:\s*)/;

function detectChordHits(line: string): ChordHit[] {
  const hits: ChordHit[] = [];
  const re = /(^|\s)([A-G](?:#|b)?[A-Za-z0-9#b]*(?:\/[A-G](?:#|b)?)?)(?=\s|$)/g;
  for (const match of line.matchAll(re)) {
    const token = (match[2] ?? "").trim();
    if (!token || !CHORD_SYMBOL_RE.test(token)) continue;
    const full = match[0] ?? token;
    const offsetInFull = full.lastIndexOf(token);
    const baseIndex = match.index ?? 0;
    hits.push({
      chord: token,
      index: baseIndex + Math.max(offsetInFull, 0),
    });
  }
  return hits;
}

function chordLineToInline(chordLine: string): string {
  const hits = detectChordHits(chordLine);
  if (hits.length === 0) return chordLine.trimEnd();
  return hits.map((hit) => `[${hit.chord}]`).join(" ");
}

function findLyricAnchorStart(lyricLine: string): number {
  const match = lyricLine.match(LYRIC_PREFIX_RE);
  if (!match) return 0;
  return (match[1] ?? "").length;
}

export function mergeChordAndLyricLines(chordLine: string, lyricLine: string): string {
  const hits = detectChordHits(chordLine);
  if (hits.length === 0) return lyricLine.trimEnd();

  let out = lyricLine.trimEnd();
  const anchorStart = findLyricAnchorStart(out);
  let offset = 0;
  for (const hit of hits) {
    const boundedPos = Math.max(
      anchorStart,
      Math.min(hit.index, lyricLine.length),
    );
    const insertPos = boundedPos + offset;
    out = `${out.slice(0, insertPos)}[${hit.chord}]${out.slice(insertPos)}`;
    offset += hit.chord.length + 2;
  }
  return out;
}

export function parseIntroLine(line: string): string | null {
  const match = line.trim().match(/^intro\b\s*:?\s*(.+)$/i);
  if (!match) return null;

  const payload = match[1] ?? "";
  const candidates = payload
    .replace(/[|,]/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const chords = candidates.filter((token) => CHORD_SYMBOL_RE.test(token));
  if (chords.length === 0) return null;

  const progression = chords.map((chord) => `[${chord}]`).join(" / ");
  return `{intro: ${progression}}`;
}

export function normalizeSectionTag(line: string): string | null {
  const trimmed = line.trim();
  const verseMatch = trimmed.match(/^verse\s*(\d+)?\s*:?\s*$/i);
  if (verseMatch) {
    const no = verseMatch[1]?.trim();
    return no ? `{comment: Verse ${no}}` : "{comment: Verse}";
  }

  const verseCompact = trimmed.match(/^verse(\d+)\s*:?\s*$/i);
  if (verseCompact) {
    return `{comment: Verse ${verseCompact[1]}}`;
  }

  for (const label of COMMENT_SECTION_LABELS) {
    const re = new RegExp(`^${label}\\s*:?\\s*$`, "i");
    if (re.test(trimmed)) {
      return `{comment: ${label}}`;
    }
  }

  return null;
}

function isLikelyChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const sectionTag = normalizeSectionTag(trimmed);
  if (sectionTag) return false;
  if (parseIntroLine(trimmed)) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((token) => CHORD_SYMBOL_RE.test(token));
}

export function convertRawLyricsToChordPro(rawText: string): string {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const current = lines[i];
    const trimmed = current.trim();

    if (!trimmed) {
      if (out.length > 0 && out[out.length - 1] !== "") {
        out.push("");
      }
      i += 1;
      continue;
    }

    const introTag = parseIntroLine(trimmed);
    if (introTag) {
      out.push(introTag);
      i += 1;
      continue;
    }

    const sectionTag = normalizeSectionTag(trimmed);
    if (sectionTag) {
      out.push(sectionTag);
      i += 1;
      continue;
    }

    if (isLikelyChordLine(current)) {
      const next = lines[i + 1];
      if (next && next.trim()) {
        const nextTrimmed = next.trim();
        const nextIsSection = !!normalizeSectionTag(nextTrimmed) || !!parseIntroLine(nextTrimmed);
        const nextIsChord = isLikelyChordLine(next);
        if (!nextIsSection && !nextIsChord) {
          out.push(mergeChordAndLyricLines(current, next));
          i += 2;
          continue;
        }
      }
      out.push(chordLineToInline(current));
      i += 1;
      continue;
    }

    out.push(current.trimEnd());
    i += 1;
  }

  while (out.length > 0 && out[out.length - 1] === "") {
    out.pop();
  }
  return out.join("\n");
}
