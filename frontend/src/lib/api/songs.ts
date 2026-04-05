import { apiFetch } from "@/lib/api/client";
import type { PaginatedSongs, SongDetail } from "@/lib/api/types";

export type ListSongsParams = {
  page?: number;
  limit?: number;
  churchId?: string;
  categorySlug?: string;
  tagSlugs?: string[];
  q?: string;
};

function toQuery(p: ListSongsParams): string {
  const q = new URLSearchParams();
  if (p.page != null) q.set("page", String(p.page));
  if (p.limit != null) q.set("limit", String(p.limit));
  if (p.churchId) q.set("churchId", p.churchId);
  if (p.categorySlug) q.set("categorySlug", p.categorySlug);
  if (p.tagSlugs?.length) q.set("tagSlugs", p.tagSlugs.join(","));
  if (p.q) q.set("q", p.q);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchSongList(
  params: ListSongsParams = {},
): Promise<PaginatedSongs> {
  return apiFetch<PaginatedSongs>(`/app/songs${toQuery(params)}`, {
    auth: false,
    retryOn401: false,
  });
}

export async function fetchSongById(id: string): Promise<SongDetail> {
  return apiFetch<SongDetail>(`/app/songs/${id}`, {
    auth: false,
    retryOn401: false,
  });
}

export type CreateSongPayload = {
  title: string;
  chordproBody: string;
  isPublished?: boolean;
};

export async function createSong(payload: CreateSongPayload): Promise<SongDetail> {
  return apiFetch<SongDetail>("/app/songs", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      chordproBody: payload.chordproBody,
      isPublished: payload.isPublished ?? true,
    }),
  });
}

export type UpdateSongPayload = {
  title?: string;
  chordproBody?: string;
  isPublished?: boolean;
};

export async function updateSong(
  id: string,
  payload: UpdateSongPayload,
): Promise<SongDetail> {
  return apiFetch<SongDetail>(`/app/songs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
