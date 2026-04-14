/** code เพลงใช้ prefix se2e- เพื่อ cleanup */
export const SONGS_E2E_CODE_PREFIX = 'se2e-';

export const SONGS_E2E_EMAILS = {
  admin: 'songs-e2e-admin@example.test',
  owner: 'songs-e2e-owner@example.test',
  member: 'songs-e2e-member@example.test',
} as const;

/** คริสตจักรเฉพาะชุดเทสเพลง — แยกจาก churches-e2e */
export const SONGS_E2E_CHURCH_CODE = 'se2e-songs-chapel';

export const SONGS_E2E_CODES = {
  globalPublished: 'se2e-global-published',
  globalDraft: 'se2e-global-draft',
  churchSong: 'se2e-church-song',
  churchEdit: 'se2e-church-edit',
  filterUnique: 'se2e-filter-unique-title-xyz',
  metaSong: 'se2e-meta-category-tags',
  toDelete: 'se2e-soft-delete',
  viewCount: 'se2e-view-count',
} as const;

/** ตัวอย่าง ChordPro มี metadata + chord */
export const SONGS_E2E_CHORDPRO = `{title: SE2E Test Song}
{key: D}
[D]สวัสดี [A]โลก [G]tests`;
