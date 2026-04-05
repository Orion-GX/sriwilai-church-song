import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoritesState = {
  songIds: string[];
  toggle: (songId: string) => void;
  has: (songId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      songIds: [],
      toggle: (songId) =>
        set((s) => {
          const on = s.songIds.includes(songId);
          return {
            songIds: on
              ? s.songIds.filter((id) => id !== songId)
              : [...s.songIds, songId],
          };
        }),
      has: (songId) => get().songIds.includes(songId),
    }),
    { name: "ccp-favorites" },
  ),
);
