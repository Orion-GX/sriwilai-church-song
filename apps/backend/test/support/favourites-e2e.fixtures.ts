/** prefix slug เพลงและอีเมล — ลบด้วย cleanup E2E favourites */
export const FAVOURITES_E2E_SLUG_PREFIX = 'se2e-fav-';

export const FAVOURITES_E2E_EMAILS = {
  userA: 'favourites-e2e-user-a@example.test',
  userB: 'favourites-e2e-user-b-system-admin@example.test',
  other: 'favourites-e2e-other@example.test',
} as const;

export const FAVOURITES_E2E_SLUGS = {
  songA: 'se2e-fav-song-a',
  songB: 'se2e-fav-song-b',
} as const;
