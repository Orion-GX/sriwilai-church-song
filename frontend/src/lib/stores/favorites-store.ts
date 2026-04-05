import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  addFavourite,
  fetchAllFavouriteSongIds,
  removeFavourite,
} from "@/lib/api/favourites";
import { useAuthStore } from "@/lib/stores/auth-store";

type FavoritesState = {
  /** โปรดในเครื่อง (เมื่อยังไม่ล็อกอิน) — persist */
  guestSongIds: string[];
  /** โปรดจาก API — null = ยังไม่โหลดหลังล็อกอิน */
  serverSongIds: string[] | null;
  resetServer: () => void;
  syncFromServer: () => Promise<void>;
  toggle: (songId: string) => Promise<void>;
  has: (songId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      guestSongIds: [],
      serverSongIds: null,

      resetServer: () => set({ serverSongIds: null }),

      syncFromServer: async () => {
        const token = useAuthStore.getState().accessToken;
        if (!token) return;
        const ids = await fetchAllFavouriteSongIds();
        set({ serverSongIds: ids });
      },

      toggle: async (songId) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          const prev = get().serverSongIds ?? [];
          const on = prev.includes(songId);
          try {
            if (on) {
              await removeFavourite(songId);
              set({ serverSongIds: prev.filter((id) => id !== songId) });
            } else {
              await addFavourite(songId);
              set({
                serverSongIds: prev.includes(songId) ? prev : [...prev, songId],
              });
            }
          } catch (err) {
            await get().syncFromServer();
            throw err;
          }
        } else {
          set((s) => ({
            guestSongIds: s.guestSongIds.includes(songId)
              ? s.guestSongIds.filter((id) => id !== songId)
              : [...s.guestSongIds, songId],
          }));
        }
      },

      has: (songId) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          return (get().serverSongIds ?? []).includes(songId);
        }
        return get().guestSongIds.includes(songId);
      },
    }),
    {
      name: "ccp-favorites",
      version: 2,
      partialize: (s) => ({ guestSongIds: s.guestSongIds }),
      migrate: (persisted: unknown, fromVersion: number) => {
        if (fromVersion < 2 && persisted && typeof persisted === "object") {
          const o = persisted as Record<string, unknown>;
          if (Array.isArray(o.guestSongIds)) {
            return { guestSongIds: o.guestSongIds as string[] };
          }
          if (Array.isArray(o.songIds)) {
            return { guestSongIds: o.songIds as string[] };
          }
        }
        if (
          persisted &&
          typeof persisted === "object" &&
          Array.isArray((persisted as { guestSongIds?: unknown }).guestSongIds)
        ) {
          return {
            guestSongIds: (persisted as { guestSongIds: string[] }).guestSongIds,
          };
        }
        return { guestSongIds: [] };
      },
    },
  ),
);

/** รายการ id สำหรับตัวกรอง "เฉพาะโปรด" — ผู้ล็อกอินใช้ข้อมูลจาก API */
export function useFavoriteSongIds(): string[] {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestSongIds = useFavoritesStore((s) => s.guestSongIds);
  const serverSongIds = useFavoritesStore((s) => s.serverSongIds);
  if (accessToken) return serverSongIds ?? [];
  return guestSongIds;
}
