export type SongSectionType = 'verse' | 'chorus' | 'bridge' | 'other';

export type SongRowKind = 'lyric_with_chords';

export interface SongContentSegment {
  chord: string | null;
  text: string;
}

export interface SongContentRow {
  id: string;
  kind: SongRowKind;
  segments: SongContentSegment[];
}

export interface SongContentSection {
  id: string;
  type: SongSectionType;
  label?: string;
  rows: SongContentRow[];
}

export interface SongContentDocument {
  sections: SongContentSection[];
}
