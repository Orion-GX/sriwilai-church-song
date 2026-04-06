/**
 * แปลง ChordPro เป็น block สำหรับเรนเดอร์
 * รองรับ {start_of_chorus} / {soc} / {start_of_chorus: ป้ายกำกับ} / {end_of_chorus} / {eoc}
 */

export type ChordProBlock =
  | { kind: "spacer" }
  | { kind: "lyric"; line: string }
  | { kind: "chorus"; label?: string; lines: string[] }
  | { kind: "title"; value: string }
  | { kind: "subtitle"; value: string }
  | { kind: "directive"; key: string; value?: string };

/**
 * แยกบรรทัดหลัง transpose แล้วประกอบเป็น block
 */
export function parseChordPro(text: string): ChordProBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: ChordProBlock[] = [];

  let normalLines: string[] = [];
  let chorus: { label?: string; lines: string[] } | null = null;

  const flushNormalLyrics = () => {
    for (const ln of normalLines) {
      if (ln === "") {
        blocks.push({ kind: "spacer" });
      } else {
        blocks.push({ kind: "lyric", line: ln });
      }
    }
    normalLines = [];
  };

  const closeChorusIfOpen = () => {
    if (chorus) {
      blocks.push({
        kind: "chorus",
        label: chorus.label,
        lines: chorus.lines,
      });
      chorus = null;
    }
  };

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (!trimmed) {
      if (chorus) {
        chorus.lines.push("");
      } else {
        normalLines.push("");
      }
      continue;
    }

    const dirColon = trimmed.match(
      /^\{([a-z][a-z0-9_]*)\s*:\s*(.*)\}\s*$/i,
    );
    if (dirColon) {
      const key = dirColon[1].toLowerCase();
      const valRaw = dirColon[2].replace(/\}\s*$/g, "").trim();

      if (key === "start_of_chorus" || key === "soc") {
        flushNormalLyrics();
        closeChorusIfOpen();
        chorus = { label: valRaw || undefined, lines: [] };
        continue;
      }
      if (key === "end_of_chorus" || key === "eoc") {
        flushNormalLyrics();
        closeChorusIfOpen();
        continue;
      }

      flushNormalLyrics();
      closeChorusIfOpen();

      if (key === "title") {
        blocks.push({ kind: "title", value: valRaw });
      } else if (key === "subtitle" || key === "st") {
        blocks.push({ kind: "subtitle", value: valRaw });
      } else {
        blocks.push({ kind: "directive", key, value: valRaw });
      }
      continue;
    }

    const dirOnly = trimmed.match(/^\{([a-z][a-z0-9_]*)\}\s*$/i);
    if (dirOnly) {
      const key = dirOnly[1].toLowerCase();
      if (key === "start_of_chorus" || key === "soc") {
        flushNormalLyrics();
        closeChorusIfOpen();
        chorus = { lines: [] };
        continue;
      }
      if (key === "end_of_chorus" || key === "eoc") {
        flushNormalLyrics();
        closeChorusIfOpen();
        continue;
      }

      flushNormalLyrics();
      closeChorusIfOpen();
      blocks.push({ kind: "directive", key });
      continue;
    }

    if (chorus) {
      chorus.lines.push(raw);
    } else {
      normalLines.push(raw);
    }
  }

  flushNormalLyrics();
  closeChorusIfOpen();

  return blocks;
}
