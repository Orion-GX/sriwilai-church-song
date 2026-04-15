import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SetlistDetail } from "@/lib/api/types";

export const GUEST_SETLIST_LIMIT = 5;

type GuestSetlistsState = {
  guestSetlists: SetlistDetail[];
  createGuestSetlist: (payload?: Partial<SetlistDetail>) => SetlistDetail | null;
  saveGuestSetlist: (setlist: SetlistDetail) => SetlistDetail;
  removeGuestSetlist: (setlistId: string) => void;
  clearGuestSetlists: () => void;
  findById: (setlistId: string) => SetlistDetail | null;
};

function defaultSetlist(index = 0): SetlistDetail {
  const now = new Date().toISOString();
  return {
    id: `guest-${crypto.randomUUID()}`,
    title: `New Setlist ${index + 1}`,
    description: null,
    serviceDate: now,
    location: "Main Sanctuary",
    durationMinutes: 45,
    totalItems: 0,
    teamName: "Worship Team",
    isPublic: false,
    publicSlug: null,
    publicUrl: null,
    presentationLayout: "vertical",
    createdBy: "guest",
    createdAt: now,
    updatedAt: now,
    songs: [],
  };
}

export const useGuestSetlistsStore = create<GuestSetlistsState>()(
  persist(
    (set, get) => ({
      guestSetlists: [],
      createGuestSetlist: (payload) => {
        const list = get().guestSetlists;
        if (list.length >= GUEST_SETLIST_LIMIT) {
          return null;
        }
        const next = {
          ...defaultSetlist(list.length),
          ...payload,
          id: payload?.id ?? `guest-${crypto.randomUUID()}`,
          songs: payload?.songs ?? [],
          totalItems: payload?.songs?.length ?? 0,
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ guestSetlists: [next, ...state.guestSetlists] }));
        return next;
      },
      saveGuestSetlist: (setlist) => {
        const normalized = {
          ...setlist,
          totalItems: setlist.songs.length,
          updatedAt: new Date().toISOString(),
        };
        set((state) => {
          const existing = state.guestSetlists.some((row) => row.id === normalized.id);
          if (existing) {
            return {
              guestSetlists: state.guestSetlists.map((row) =>
                row.id === normalized.id ? normalized : row,
              ),
            };
          }
          if (state.guestSetlists.length >= GUEST_SETLIST_LIMIT) {
            return state;
          }
          return { guestSetlists: [normalized, ...state.guestSetlists] };
        });
        return normalized;
      },
      removeGuestSetlist: (setlistId) =>
        set((state) => ({
          guestSetlists: state.guestSetlists.filter((row) => row.id !== setlistId),
        })),
      clearGuestSetlists: () => set({ guestSetlists: [] }),
      findById: (setlistId) =>
        get().guestSetlists.find((row) => row.id === setlistId) ?? null,
    }),
    {
      name: "ccp-setlists-guest",
      partialize: (state) => ({ guestSetlists: state.guestSetlists }),
    },
  ),
);
