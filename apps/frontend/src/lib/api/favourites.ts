import { apiFetch } from "@/lib/api/client";
import type { PaginatedSongs, SongListItem } from "@/lib/api/types";

export type AddFavouriteResponse = {
  song: SongListItem;
  duplicate: boolean;
};

export async function fetchFavouritesPage(
  page = 1,
  limit = 100,
): Promise<PaginatedSongs> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch<PaginatedSongs>(`/app/favourites?${q.toString()}`);
}

/** ดึง id ทุกหน้าจนครบ (limit ต่อหน้าสูงสุดตาม backend) */
export async function fetchAllFavouriteSongIds(): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await fetchFavouritesPage(page, limit);
    ids.push(...res.items.map((i) => i.id));
    if (res.items.length < limit || page * limit >= res.total) break;
    page += 1;
  }
  return ids;
}

export async function addFavourite(songId: string): Promise<AddFavouriteResponse> {
  return apiFetch<AddFavouriteResponse>("/app/favourites", {
    method: "POST",
    body: JSON.stringify({ songId }),
  });
}

export async function removeFavourite(songId: string): Promise<void> {
  return apiFetch<void>(`/app/favourites/${songId}`, {
    method: "DELETE",
  });
}
