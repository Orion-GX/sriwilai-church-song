import { ChordTransposeService } from './chord-transpose.service';

describe('ChordTransposeService', () => {
  const service = new ChordTransposeService();

  it('parses common symbols', () => {
    expect(service.parseChordSymbol('Gmaj7')).toEqual({
      root: 'G',
      suffix: 'maj7',
      bass: null,
    });
    expect(service.parseChordSymbol('A/C#')).toEqual({
      root: 'A',
      suffix: '',
      bass: 'C#',
    });
  });

  it('transposes symbols including slash bass', () => {
    expect(service.transposeSymbol('Gmaj7', 2)).toBe('Amaj7');
    expect(service.transposeSymbol('F#m7', -2)).toBe('Em7');
    expect(service.transposeSymbol('Bb', 2)).toBe('C');
    expect(service.transposeSymbol('A/C#', 2)).toBe('B/D#');
    expect(service.transposeSymbol('Dsus4', -2)).toBe('Csus4');
    expect(service.transposeSymbol('Em7', 1)).toBe('Fm7');
  });

  it('transposes chordpro body without mutating non-chord text', () => {
    const body = '{title: Demo}\n[G]line [A/C#]two';
    expect(service.transposeChordProBody(body, 2)).toBe('{title: Demo}\n[A]line [B/D#]two');
  });
});
