/**
 * ให้ตรงกับ backend SongsService.slugify + normalizeTagSlug (ความยาวสูงสุด 80)
 */
export function slugifySongTag(raw: string): string {
  const base = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base.length > 0 ? base : "tag";
}
