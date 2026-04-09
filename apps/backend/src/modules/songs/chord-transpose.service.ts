import { Injectable } from '@nestjs/common';

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

export type ParsedChord = {
  root: string;
  suffix: string;
  bass: string | null;
};

@Injectable()
export class ChordTransposeService {
  parseChordSymbol(symbol: string): ParsedChord | null {
    const trimmed = symbol.trim();
    const m = trimmed.match(/^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/);
    if (!m) return null;
    const root = `${m[1]}${m[2] ?? ''}`;
    const suffix = m[3] ?? '';
    const bass = m[4] ? `${m[4]}${m[5] ?? ''}` : null;
    if (NOTE_INDEX[root] === undefined) return null;
    if (bass != null && NOTE_INDEX[bass] === undefined) return null;
    return { root, suffix, bass };
  }

  transposeSymbol(symbol: string, semitones: number): string {
    if (semitones === 0) return symbol;
    const parsed = this.parseChordSymbol(symbol);
    if (!parsed) return symbol;
    const useFlat = parsed.root.includes('b');
    const nextRoot = this.transposeNote(parsed.root, semitones, useFlat);
    const nextBass = parsed.bass ? this.transposeNote(parsed.bass, semitones, parsed.bass.includes('b')) : null;
    return `${nextRoot}${parsed.suffix}${nextBass ? `/${nextBass}` : ''}`;
  }

  transposeChordProBody(body: string, semitones: number): string {
    if (semitones === 0) return body;
    return body.replace(/\[([^\]]+)\]/g, (_full, inner: string) => {
      const chords = inner
        .split('|')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => this.transposeSymbol(chunk, semitones));
      return `[${chords.join(' | ')}]`;
    });
  }

  private transposeNote(note: string, semitones: number, preferFlat: boolean): string {
    const idx = NOTE_INDEX[note];
    if (idx === undefined) return note;
    const target = (idx + semitones + 1200) % 12;
    return preferFlat ? FLAT_NOTES[target] : SHARP_NOTES[target];
  }
}
