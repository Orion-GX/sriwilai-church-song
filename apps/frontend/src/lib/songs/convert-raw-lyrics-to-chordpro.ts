const CHORD_SYMBOL_RE =
  /^[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug)?(?:\d+)?(?:[#b]?\d+)?(?:\/[A-G](?:#|b)?)?$/;

type ChordHit = {
  chord: string;
  index: number;
};

type CanonicalSection = "verse" | "chorus" | "bridge" | "tag";
type ProgressionDirective =
  | "intro"
  | "outro"
  | "instrument"
  | "interlude"
  | "solo"
  | "midtro";

const LYRIC_PREFIX_RE = /^(\s*(?:\d+|[A-Za-z])\s*:\s*)/;

function detectChordHits(line: string): ChordHit[] {
  const hits: ChordHit[] = [];
  const re = /(^|\s)([A-G](?:#|b)?[A-Za-z0-9#b]*(?:\/[A-G](?:#|b)?)?)(?=\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
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
    const boundedPos = Math.max(anchorStart, Math.min(hit.index, lyricLine.length));
    const insertPos = boundedPos + offset;
    out = `${out.slice(0, insertPos)}[${hit.chord}]${out.slice(insertPos)}`;
    offset += hit.chord.length + 2;
  }
  return out;
}

function buildProgressionDirective(
  label: ProgressionDirective,
  payload: string,
): string | null {
  const candidates = payload
    .replace(/[|,]/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const chords = candidates.filter((token) => CHORD_SYMBOL_RE.test(token));
  if (chords.length === 0) return null;
  const progression = chords.map((chord) => `[${chord}]`).join(" / ");
  return `{${label}: ${progression}}`;
}

export function parseIntroLine(line: string): string | null {
  const match = line.trim().match(/^intro\b\s*:?\s*(.+)$/i);
  if (!match) return null;
  return buildProgressionDirective("intro", match[1] ?? "");
}

function parseProgressionDirectiveLine(
  line: string,
  label: Exclude<ProgressionDirective, "intro">,
): string | null {
  const match = line.trim().match(new RegExp(`^${label}\\b\\s*:?\\s*(.+)$`, "i"));
  if (!match) return null;
  return buildProgressionDirective(label, match[1] ?? "");
}

function detectCanonicalSection(line: string): {
  key: CanonicalSection;
  value?: string;
} | null {
  const trimmed = line.trim();
  const verseMatch = trimmed.match(/^verse\s*(\d+)?\s*:?\s*$/i);
  if (verseMatch) {
    const no = verseMatch[1]?.trim();
    return { key: "verse", value: no || undefined };
  }
  const verseCompact = trimmed.match(/^verse(\d+)\s*:?\s*$/i);
  if (verseCompact) {
    return { key: "verse", value: verseCompact[1] };
  }

  const chorusMatch = trimmed.match(/^chorus\s*(\d+)?\s*:?\s*$/i);
  if (chorusMatch) {
    return { key: "chorus", value: chorusMatch[1]?.trim() || undefined };
  }

  const bridgeMatch = trimmed.match(/^bridge\s*(\d+)?\s*:?\s*$/i);
  if (bridgeMatch) {
    return { key: "bridge", value: bridgeMatch[1]?.trim() || undefined };
  }

  const tagMatch = trimmed.match(/^tag\s*(\d+)?\s*:?\s*$/i);
  if (tagMatch) {
    return { key: "tag", value: tagMatch[1]?.trim() || undefined };
  }

  return null;
}

export function normalizeSectionTag(line: string): string | null {
  const detected = detectCanonicalSection(line);
  if (!detected) return null;
  return detected.value
    ? `{${detected.key}: ${detected.value}}`
    : `{${detected.key}}`;
}

function formatSectionTagWithCounter(
  section: CanonicalSection,
  rawValue: string | undefined,
  counters: Record<CanonicalSection, number>,
): string {
  if (rawValue) return `{${section}: ${rawValue}}`;
  counters[section] += 1;
  return `{${section}: ${counters[section]}}`;
}

function parseStructuredTag(
  line: string,
  counters: Record<CanonicalSection, number>,
): string | null {
  const introTag = parseIntroLine(line);
  if (introTag) return introTag;

  const outroTag = parseProgressionDirectiveLine(line, "outro");
  if (outroTag) return outroTag;

  const instrumentTag = parseProgressionDirectiveLine(line, "instrument");
  if (instrumentTag) return instrumentTag;
  const interludeTag = parseProgressionDirectiveLine(line, "interlude");
  if (interludeTag) return interludeTag;
  const soloTag = parseProgressionDirectiveLine(line, "solo");
  if (soloTag) return soloTag;
  const midtroTag = parseProgressionDirectiveLine(line, "midtro");
  if (midtroTag) return midtroTag;

  const section = detectCanonicalSection(line);
  if (!section) return null;
  return formatSectionTagWithCounter(section.key, section.value, counters);
}

function isStructuredTagLine(line: string): boolean {
  return (
    !!parseIntroLine(line) ||
    !!parseProgressionDirectiveLine(line, "outro") ||
    !!parseProgressionDirectiveLine(line, "instrument") ||
    !!parseProgressionDirectiveLine(line, "interlude") ||
    !!parseProgressionDirectiveLine(line, "solo") ||
    !!parseProgressionDirectiveLine(line, "midtro") ||
    !!detectCanonicalSection(line)
  );
}

function isLikelyChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (parseIntroLine(trimmed)) return false;
  if (parseProgressionDirectiveLine(trimmed, "outro")) return false;
  if (parseProgressionDirectiveLine(trimmed, "instrument")) return false;
  if (parseProgressionDirectiveLine(trimmed, "interlude")) return false;
  if (parseProgressionDirectiveLine(trimmed, "solo")) return false;
  if (parseProgressionDirectiveLine(trimmed, "midtro")) return false;
  if (normalizeSectionTag(trimmed)) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((token) => CHORD_SYMBOL_RE.test(token));
}

export function convertRawLyricsToChordPro(rawText: string): string {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  const sectionCounters: Record<CanonicalSection, number> = {
    verse: 0,
    chorus: 0,
    bridge: 0,
    tag: 0,
  };

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

    const structuredTag = parseStructuredTag(trimmed, sectionCounters);
    if (structuredTag) {
      out.push(structuredTag);
      i += 1;
      continue;
    }

    if (isLikelyChordLine(current)) {
      const next = lines[i + 1];
      if (next && next.trim()) {
        const nextTrimmed = next.trim();
        const nextIsSection = isStructuredTagLine(nextTrimmed);
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
