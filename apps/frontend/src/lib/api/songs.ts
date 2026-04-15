import { apiFetch } from "@/lib/api/client";
import type {
  PaginatedSongs,
  SongCategoryCatalogItem,
  SongContentDocument,
  SongDetail,
  SongVersion,
  SongTagCatalogItem,
} from "@/lib/api/types";

export type ListSongsParams = {
  page?: number;
  limit?: number;
  churchId?: string;
  categorySlug?: string;
  categoryCode?: string;
  tagSlugs?: string[];
  tagCodes?: string[];
  q?: string;
  isPublished?: boolean;
  sortBy?: "title" | "viewCount" | "createdAt";
  sortOrder?: "ASC" | "DESC";
};

function toQuery(p: ListSongsParams): string {
  const q = new URLSearchParams();
  if (p.page != null) q.set("page", String(p.page));
  if (p.limit != null) q.set("limit", String(p.limit));
  if (p.churchId) q.set("churchId", p.churchId);
  if (p.categoryCode) q.set("categoryCode", p.categoryCode);
  else if (p.categorySlug) q.set("categorySlug", p.categorySlug);
  if (p.tagCodes?.length) q.set("tagCodes", p.tagCodes.join(","));
  else if (p.tagSlugs?.length) q.set("tagSlugs", p.tagSlugs.join(","));
  if (p.q) q.set("q", p.q);
  if (p.isPublished != null) q.set("isPublished", String(p.isPublished));
  if (p.sortBy) q.set("sortBy", p.sortBy);
  if (p.sortOrder) q.set("sortOrder", p.sortOrder);
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

export async function fetchSongAdminList(
  params: ListSongsParams = {},
): Promise<PaginatedSongs> {
  return apiFetch<PaginatedSongs>(`/app/admin/songs${toQuery(params)}`);
}

export async function fetchSongById(id: string): Promise<SongDetail> {
  return apiFetch<SongDetail>(`/app/songs/${id}`, {
    auth: false,
    retryOn401: false,
  });
}

export async function fetchSongAdminById(id: string): Promise<SongDetail> {
  return apiFetch<SongDetail>(`/app/admin/songs/${id}`);
}

export async function fetchSongCategories(): Promise<SongCategoryCatalogItem[]> {
  return apiFetch<SongCategoryCatalogItem[]>("/app/songs/categories", {
    auth: false,
    retryOn401: false,
  });
}

export async function fetchSongAdminCategories(): Promise<SongCategoryCatalogItem[]> {
  return apiFetch<SongCategoryCatalogItem[]>("/app/admin/songs/categories");
}

export async function fetchSongTagsCatalog(): Promise<SongTagCatalogItem[]> {
  return apiFetch<SongTagCatalogItem[]>("/app/songs/tags", {
    auth: false,
    retryOn401: false,
  });
}

export async function fetchSongAdminTagsCatalog(): Promise<SongTagCatalogItem[]> {
  return apiFetch<SongTagCatalogItem[]>("/app/admin/songs/tags");
}

export type CreateSongPayload = {
  title: string;
  chordproBody: string;
  isPublished?: boolean;
  categoryId?: string;
  tagCodes?: string[];
  /** @deprecated use tagCodes */
  tagSlugs?: string[];
  contentJson?: SongContentDocument;
  originalKey?: string;
  tempo?: number;
  timeSignature?: string;
  coverImageUrl?: string;
  versions?: Array<{
    id?: string;
    code: "th" | "en" | "custom";
    name: string;
    chordproBody: string;
    contentJson?: SongContentDocument | null;
    isDefault?: boolean;
    sortOrder?: number;
  }>;
};

export async function createSong(payload: CreateSongPayload): Promise<SongDetail> {
  const resolvedTagCodes = payload.tagCodes ?? payload.tagSlugs;
  return apiFetch<SongDetail>("/app/admin/songs", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      chordproBody: payload.chordproBody,
      isPublished: payload.isPublished ?? true,
      ...(payload.categoryId ? { categoryId: payload.categoryId } : {}),
      ...(resolvedTagCodes?.length ? { tagCodes: resolvedTagCodes } : {}),
      ...(payload.contentJson ? { contentJson: payload.contentJson } : {}),
      ...(payload.originalKey ? { originalKey: payload.originalKey } : {}),
      ...(payload.tempo != null ? { tempo: payload.tempo } : {}),
      ...(payload.timeSignature ? { timeSignature: payload.timeSignature } : {}),
      ...(payload.coverImageUrl ? { coverImageUrl: payload.coverImageUrl } : {}),
      ...(payload.versions?.length ? { versions: payload.versions } : {}),
    }),
  });
}

export type UpdateSongPayload = {
  title?: string;
  chordproBody?: string;
  isPublished?: boolean;
  categoryId?: string | null;
  tagCodes?: string[];
  /** @deprecated use tagCodes */
  tagSlugs?: string[];
  contentJson?: SongContentDocument | null;
  originalKey?: string | null;
  tempo?: number | null;
  timeSignature?: string | null;
  coverImageUrl?: string | null;
  versions?: Array<{
    id?: string;
    code: "th" | "en" | "custom";
    name: string;
    chordproBody: string;
    contentJson?: SongContentDocument | null;
    isDefault?: boolean;
    sortOrder?: number;
  }>;
};

export async function updateSong(
  id: string,
  payload: UpdateSongPayload,
): Promise<SongDetail> {
  const resolvedTagCodes = payload.tagCodes ?? payload.tagSlugs;
  const body = Object.fromEntries(
    Object.entries({
      ...payload,
      ...(resolvedTagCodes !== undefined ? { tagCodes: resolvedTagCodes } : {}),
      tagSlugs: undefined,
    }).filter(([, v]) => v !== undefined),
  );
  return apiFetch<SongDetail>(`/app/admin/songs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function updateSongStatus(
  id: string,
  isPublished: boolean,
): Promise<SongDetail> {
  return updateSong(id, { isPublished });
}

export async function deleteSong(id: string): Promise<void> {
  await apiFetch<void>(`/app/admin/songs/${id}`, {
    method: "DELETE",
  });
}

export type CreateSongVersionPayload = {
  code: "th" | "en" | "custom";
  name: string;
  chordproBody: string;
  contentJson?: SongContentDocument | null;
  isDefault?: boolean;
  sortOrder?: number;
};

export type UpdateSongVersionPayload = Partial<CreateSongVersionPayload>;

export async function createSongVersion(
  songId: string,
  payload: CreateSongVersionPayload,
): Promise<SongDetail> {
  return apiFetch<SongDetail>(`/app/admin/songs/${songId}/versions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSongVersion(
  songId: string,
  versionId: string,
  payload: UpdateSongVersionPayload,
): Promise<SongDetail> {
  const body = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined),
  );
  return apiFetch<SongDetail>(`/app/admin/songs/${songId}/versions/${versionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteSongVersion(songId: string, versionId: string): Promise<void> {
  await apiFetch<void>(`/app/admin/songs/${songId}/versions/${versionId}`, {
    method: "DELETE",
  });
}

export function pickDefaultVersion(versions: SongVersion[]): SongVersion | null {
  if (!versions.length) return null;
  return (
    versions.find((v) => v.isDefault) ??
    versions.slice().sort((a, b) => a.sortOrder - b.sortOrder)[0]
  );
}
