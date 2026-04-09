import { SongContentNormalizerService } from './song-content-normalizer.service';

describe('SongContentNormalizerService', () => {
  const service = new SongContentNormalizerService();

  it('validates and normalizes contentJson', () => {
    const normalized = service.validateContentJson({
      sections: [
        {
          id: 'secA',
          type: 'verse',
          rows: [
            {
              id: 'rowA',
              kind: 'lyric_with_chords',
              segments: [{ chord: 'G', text: 'ทุกวัน', text_en: 'All day' }],
            },
          ],
        },
      ],
    });
    expect(normalized.sections[0].rows[0].segments[0].chord).toBe('G');
  });

  it('imports 3-line raw text blocks', () => {
    const doc = service.importThreeLineBlock(
      `G C\nทุกวันเวลา ข้าอยากอยู่ใกล้ชิดพระองค์\nAll of My Days I Want To Be Close To You`,
    );
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].rows).toHaveLength(1);
    expect(doc.sections[0].rows[0].segments[0].chord).toBe('G');
  });
});
