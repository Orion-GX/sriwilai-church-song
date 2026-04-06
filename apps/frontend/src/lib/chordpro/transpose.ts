/** index 0..11 โน้ตมาตรฐาน (sharp) */
const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const NOTE_TO_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/**
 * แปลง chord symbol (เช่น F#m7) ขึ้น/ลงเป็นเสียงเต็ม
 */
export function transposeChordSymbol(chord: string, semitones: number): string {
  const trimmed = chord.trim();
  const m = trimmed.match(/^([A-G])([#b]?)((?:\/[A-G][#b]?)|.*)?$/);
  if (!m) {
    return chord;
  }
  const base = m[1] + (m[2] || "");
  const qualityAndBass = m[3] ?? "";
  const idx = NOTE_TO_INDEX[base];
  if (idx === undefined) {
    return chord;
  }
  const next = (idx + semitones + 12_000) % 12;
  const root = SHARP[next];
  return root + qualityAndBass;
}

/** แทนที่ [Chord] ทุกจุดในเนื้อ ChordPro */
export function transposeChordproText(body: string, semitones: number): string {
  if (semitones === 0) return body;
  return body.replace(/\[([^\]]+)\]/g, (_, inner: string) => {
    const parts = inner.split("|").map((p) => p.trim());
    const transposed = parts.map((p) => transposeChordSymbol(p, semitones));
    return `[${transposed.join(" | ")}]`;
  });
}
