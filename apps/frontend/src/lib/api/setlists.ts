import { apiFetch } from "@/lib/api/client";
import type {
  CreateSetlistSongInput,
  CreateSetlistInput,
  SetlistDetail,
  SetlistPresentationLayout,
} from "@/lib/api/types";

export type PatchSetlistInput = Partial<
  Pick<
    SetlistDetail,
    | "title"
    | "description"
    | "serviceDate"
    | "location"
    | "durationMinutes"
    | "teamName"
    | "presentationLayout"
    | "isPublic"
  >
>;

export type PatchSetlistSongInput = Partial<
  Pick<
    SetlistDetail["songs"][number],
    | "songId"
    | "title"
    | "artist"
    | "originalKey"
    | "selectedKey"
    | "bpm"
    | "order"
    | "transitionNotes"
    | "notes"
    | "capo"
    | "duration"
    | "arrangement"
    | "version"
  >
>;

export async function fetchPersonalSetlists(): Promise<SetlistDetail[]> {
  return apiFetch<SetlistDetail[]>("/app/setlists/personal");
}

export async function fetchSetlistById(setlistId: string): Promise<SetlistDetail> {
  return apiFetch<SetlistDetail>(`/app/setlists/personal/${setlistId}`);
}

export async function createSetlist(payload: CreateSetlistInput): Promise<SetlistDetail> {
  return apiFetch<SetlistDetail>("/app/setlists/personal", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSetlist(
  setlistId: string,
  payload: PatchSetlistInput,
): Promise<SetlistDetail> {
  const body = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
  return apiFetch<SetlistDetail>(`/app/setlists/personal/${setlistId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function reorderSetlistSongs(
  setlistId: string,
  items: Array<{ id: string; order: number }>,
): Promise<SetlistDetail> {
  return apiFetch<SetlistDetail>(`/app/setlists/personal/${setlistId}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

export async function updateSetlistSong(
  setlistId: string,
  itemId: string,
  payload: PatchSetlistSongInput,
): Promise<SetlistDetail> {
  const body = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
  return apiFetch<SetlistDetail>(
    `/app/setlists/personal/${setlistId}/song-items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function addSetlistSong(
  setlistId: string,
  payload: CreateSetlistSongInput,
): Promise<SetlistDetail> {
  return apiFetch<SetlistDetail>(`/app/setlists/personal/${setlistId}/song-items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSetlistVisibility(
  setlistId: string,
  isPublic: boolean,
): Promise<SetlistDetail> {
  return apiFetch<SetlistDetail>(`/app/setlists/personal/${setlistId}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ isPublic }),
  });
}

export async function generatePublicSetlistLink(
  setlistId: string,
  rotate = false,
): Promise<SetlistDetail> {
  return apiFetch<SetlistDetail>(`/app/setlists/personal/${setlistId}/public-link`, {
    method: "POST",
    body: JSON.stringify({ rotate }),
  });
}

export async function setSetlistPresentationLayout(
  setlistId: string,
  presentationLayout: SetlistPresentationLayout,
): Promise<SetlistDetail> {
  return updateSetlist(setlistId, { presentationLayout });
}

export async function fetchPublicSetlistBySlug(slug: string): Promise<SetlistDetail> {
  return apiFetch<SetlistDetail>(`/app/setlists/public/${slug}`, {
    auth: false,
    retryOn401: false,
  });
}
