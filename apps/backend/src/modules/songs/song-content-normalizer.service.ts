import { BadRequestException, Injectable } from '@nestjs/common';

import {
  SongContentDocument,
  SongContentRow,
  SongContentSection,
  SongContentSegment,
} from './types/song-content.type';

@Injectable()
export class SongContentNormalizerService {
  validateContentJson(content: SongContentDocument): SongContentDocument {
    if (!content || typeof content !== 'object' || !Array.isArray(content.sections)) {
      throw new BadRequestException('contentJson.sections must be an array');
    }

    const sections = content.sections.map((section, secIndex) =>
      this.normalizeSection(section, secIndex),
    );
    if (sections.length === 0) {
      throw new BadRequestException('contentJson.sections must not be empty');
    }
    return { sections };
  }

  importThreeLineBlock(rawText: string): SongContentDocument {
    const rows = rawText
      .split(/\r?\n\r?\n/)
      .map((b) => b.trim())
      .filter(Boolean)
      .map((block, blockIndex) => this.parseThreeLineBlock(block, blockIndex));

    if (rows.length === 0) {
      throw new BadRequestException('rawText must contain at least one 3-line block');
    }

    return {
      sections: [
        {
          id: 'sec_1',
          type: 'verse',
          label: 'Verse 1',
          rows,
        },
      ],
    };
  }

  private normalizeSection(section: SongContentSection, secIndex: number): SongContentSection {
    if (!section || typeof section !== 'object') {
      throw new BadRequestException(`contentJson.sections[${secIndex}] must be an object`);
    }
    const type = section.type;
    if (!['verse', 'chorus', 'bridge', 'other'].includes(type)) {
      throw new BadRequestException(`contentJson.sections[${secIndex}].type is invalid`);
    }
    if (!Array.isArray(section.rows) || section.rows.length === 0) {
      throw new BadRequestException(`contentJson.sections[${secIndex}].rows must not be empty`);
    }
    return {
      id: this.cleanId(section.id, `sec_${secIndex + 1}`),
      type,
      label: section.label?.trim() || undefined,
      rows: section.rows.map((row, rowIndex) => this.normalizeRow(row, secIndex, rowIndex)),
    };
  }

  private normalizeRow(row: SongContentRow, secIndex: number, rowIndex: number): SongContentRow {
    if (!row || typeof row !== 'object') {
      throw new BadRequestException(
        `contentJson.sections[${secIndex}].rows[${rowIndex}] must be an object`,
      );
    }
    if (row.kind !== 'lyric_with_chords') {
      throw new BadRequestException(
        `contentJson.sections[${secIndex}].rows[${rowIndex}].kind is invalid`,
      );
    }
    if (!Array.isArray(row.segments) || row.segments.length === 0) {
      throw new BadRequestException(
        `contentJson.sections[${secIndex}].rows[${rowIndex}].segments must not be empty`,
      );
    }
    return {
      id: this.cleanId(row.id, `row_${secIndex + 1}_${rowIndex + 1}`),
      kind: 'lyric_with_chords',
      segments: row.segments.map((segment, segIndex) =>
        this.normalizeSegment(segment, secIndex, rowIndex, segIndex),
      ),
    };
  }

  private normalizeSegment(
    segment: SongContentSegment,
    secIndex: number,
    rowIndex: number,
    segIndex: number,
  ): SongContentSegment {
    if (!segment || typeof segment !== 'object') {
      throw new BadRequestException(
        `contentJson.sections[${secIndex}].rows[${rowIndex}].segments[${segIndex}] must be an object`,
      );
    }
    const chord =
      segment.chord == null
        ? null
        : typeof segment.chord === 'string'
          ? segment.chord.trim().slice(0, 50)
          : null;
    if (segment.chord != null && chord == null) {
      throw new BadRequestException(
        `contentJson.sections[${secIndex}].rows[${rowIndex}].segments[${segIndex}].chord must be string|null`,
      );
    }
    const text = this.cleanText(segment.text);
    return { chord, text };
  }

  private parseThreeLineBlock(block: string, blockIndex: number): SongContentRow {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 3) {
      throw new BadRequestException(
        `rawText block ${blockIndex + 1} must contain at least 3 lines (chord/th/en)`,
      );
    }
    const chordLine = lines[0];
    const textTh = lines[1];
    const chords = chordLine.split(/\s+/).filter(Boolean);
    if (chords.length === 0) {
      throw new BadRequestException(`rawText block ${blockIndex + 1} has no chord tokens`);
    }
    const thParts = this.splitTextRoughly(textTh, chords.length);
    const segments: SongContentSegment[] = chords.map((chord, index) => ({
      chord,
      text: thParts[index] ?? '',
    }));
    return {
      id: `row_${blockIndex + 1}`,
      kind: 'lyric_with_chords',
      segments,
    };
  }

  private splitTextRoughly(text: string, segmentCount: number): string[] {
    const chunks = text
      .split(/\s{2,}/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (chunks.length <= 1) {
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) return Array.from({ length: segmentCount }, () => '');
      if (segmentCount === 1) return [words.join(' ')];
      const approx = Math.ceil(words.length / segmentCount);
      const out: string[] = [];
      for (let i = 0; i < words.length; i += approx) {
        out.push(words.slice(i, i + approx).join(' '));
      }
      while (out.length < segmentCount) out.push('');
      if (out.length > segmentCount) {
        out[segmentCount - 1] = out.slice(segmentCount - 1).join(' ');
        out.length = segmentCount;
      }
      return out;
    }
    while (chunks.length < segmentCount) chunks.push('');
    if (chunks.length > segmentCount) {
      chunks[segmentCount - 1] = chunks.slice(segmentCount - 1).join(' ');
      chunks.length = segmentCount;
    }
    return chunks;
  }

  private cleanId(value: string | undefined, fallback: string): string {
    const v = (value ?? '').trim();
    return v ? v.slice(0, 120) : fallback;
  }

  private cleanText(value: string | undefined): string {
    if (typeof value !== 'string') return '';
    return value.slice(0, 5000);
  }
}
