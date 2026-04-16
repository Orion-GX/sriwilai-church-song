"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSetlist,
  fetchPersonalSetlists,
  fetchPublicSetlistBySlug,
  fetchSetlistById,
  generatePublicSetlistLink,
  reorderSetlistSongs,
  setSetlistPresentationLayout,
  updateSetlist,
  updateSetlistSong,
  updateSetlistVisibility,
} from "@/lib/api/setlists";
import type {
  CreateSetlistInput,
  SetlistDetail,
  SetlistPresentationLayout,
  SetlistSongItem,
} from "@/lib/api/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  GUEST_SETLIST_LIMIT,
  useGuestSetlistsStore,
} from "@/lib/stores/setlists-guest-store";

export const setlistQueryKeys = {
  all: ["setlists"] as const,
  list: () => [...setlistQueryKeys.all, "list"] as const,
  detail: (id: string) => [...setlistQueryKeys.all, "detail", id] as const,
  public: (slug: string) => [...setlistQueryKeys.all, "public", slug] as const,
};

function sortSongs(songs: SetlistSongItem[]): SetlistSongItem[] {
  return [...songs].sort((a, b) => a.order - b.order);
}

function normalizeOrders(songs: SetlistSongItem[]): SetlistSongItem[] {
  return sortSongs(songs).map((song, idx) => ({ ...song, order: idx }));
}

function isGuestContext(accessToken: string | null) {
  return !accessToken;
}

function useGuestSetlistsHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useGuestSetlistsStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribeHydrate = useGuestSetlistsStore.persist.onHydrate(() => {
      setHydrated(false);
    });
    const unsubscribeFinishHydration =
      useGuestSetlistsStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
    setHydrated(useGuestSetlistsStore.persist.hasHydrated());
    return () => {
      unsubscribeHydrate();
      unsubscribeFinishHydration();
    };
  }, []);

  return hydrated;
}

export function useSetlistDetail(setlistId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestSetlist = useGuestSetlistsStore((s) => s.findById(setlistId));
  const isGuest = isGuestContext(accessToken);
  const guestStoreHydrated = useGuestSetlistsHydrated();

  return useQuery({
    queryKey: setlistQueryKeys.detail(setlistId),
    enabled: Boolean(setlistId) && (!isGuest || guestStoreHydrated),
    queryFn: async () => {
      if (isGuest) {
        if (!guestSetlist) {
          throw new Error("Guest setlist not found");
        }
        return guestSetlist;
      }
      return fetchSetlistById(setlistId);
    },
    initialData: guestSetlist ?? undefined,
  });
}

export function useSetlistSongs(setlistId: string) {
  const detail = useSetlistDetail(setlistId);
  return useMemo(() => sortSongs(detail.data?.songs ?? []), [detail.data?.songs]);
}

export function useSongReorder(setlistId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const saveGuestSetlist = useGuestSetlistsStore((s) => s.saveGuestSetlist);
  const findById = useGuestSetlistsStore((s) => s.findById);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedSongIds: string[]) => {
      if (isGuestContext(accessToken)) {
        const current = findById(setlistId);
        if (!current) throw new Error("Guest setlist not found");
        const orderMap = new Map(orderedSongIds.map((id, idx) => [id, idx]));
        const nextSongs = normalizeOrders(
          current.songs.map((song) => ({
            ...song,
            order: orderMap.get(song.id) ?? song.order,
          })),
        );
        return saveGuestSetlist({ ...current, songs: nextSongs });
      }
      return reorderSetlistSongs(
        setlistId,
        orderedSongIds.map((id, idx) => ({ id, order: idx })),
      );
    },
    onSuccess: (next) => {
      queryClient.setQueryData(setlistQueryKeys.detail(setlistId), next);
      queryClient.invalidateQueries({ queryKey: setlistQueryKeys.list() });
    },
  });
}

export function useSongKeyChange(setlistId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const saveGuestSetlist = useGuestSetlistsStore((s) => s.saveGuestSetlist);
  const findById = useGuestSetlistsStore((s) => s.findById);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { itemId: string; selectedKey: string }) => {
      if (isGuestContext(accessToken)) {
        const current = findById(setlistId);
        if (!current) throw new Error("Guest setlist not found");
        return saveGuestSetlist({
          ...current,
          songs: current.songs.map((song) =>
            song.id === input.itemId ? { ...song, selectedKey: input.selectedKey } : song,
          ),
        });
      }
      return updateSetlistSong(setlistId, input.itemId, {
        selectedKey: input.selectedKey,
      });
    },
    onSuccess: (next) => {
      queryClient.setQueryData(setlistQueryKeys.detail(setlistId), next);
    },
  });
}

export function usePresentationMode(initialLayout: SetlistPresentationLayout = "vertical") {
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<SetlistPresentationLayout>(initialLayout);
  const [fontScale, setFontScale] = useState(1);
  const [showChords, setShowChords] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);

  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);

  return {
    isOpen,
    layout,
    fontScale,
    showChords,
    showMetadata,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    setLayout,
    setFontScale,
    setShowChords,
    setShowMetadata,
    toggleChords: () => setShowChords((v) => !v),
    toggleMetadata: () => setShowMetadata((v) => !v),
  };
}

export function usePublicSetlistAccess(setlistId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const saveGuestSetlist = useGuestSetlistsStore((s) => s.saveGuestSetlist);
  const findById = useGuestSetlistsStore((s) => s.findById);

  const updateCache = (next: SetlistDetail) => {
    queryClient.setQueryData(setlistQueryKeys.detail(setlistId), next);
  };

  return {
    setVisibility: useMutation({
      mutationFn: async (isPublic: boolean) => {
        if (isGuestContext(accessToken)) {
          throw new Error("Login required to enable public setlist");
        }
        return updateSetlistVisibility(setlistId, isPublic);
      },
      onSuccess: updateCache,
    }),
    generatePublicLink: useMutation({
      mutationFn: async () => {
        if (isGuestContext(accessToken)) {
          throw new Error("Login required to generate public setlist link");
        }
        return generatePublicSetlistLink(setlistId, false);
      },
      onSuccess: updateCache,
    }),
    setPresentationLayout: useMutation({
      mutationFn: async (layout: SetlistPresentationLayout) => {
        if (isGuestContext(accessToken)) {
          const current = findById(setlistId);
          if (!current) throw new Error("Guest setlist not found");
          return saveGuestSetlist({ ...current, presentationLayout: layout });
        }
        return setSetlistPresentationLayout(setlistId, layout);
      },
      onSuccess: updateCache,
    }),
  };
}

export function useSetlistsRepository() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestSetlists = useGuestSetlistsStore((s) => s.guestSetlists);
  const createGuestSetlist = useGuestSetlistsStore((s) => s.createGuestSetlist);
  const removeGuestSetlist = useGuestSetlistsStore((s) => s.removeGuestSetlist);
  const guestStoreHydrated = useGuestSetlistsHydrated();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [...setlistQueryKeys.list(), accessToken ? "auth" : "guest"],
    enabled: Boolean(accessToken) || guestStoreHydrated,
    queryFn: async () => {
      if (!accessToken) {
        return guestSetlists;
      }
      return fetchPersonalSetlists();
    },
    initialData: accessToken ? undefined : guestSetlists,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateSetlistInput) => {
      if (!accessToken) {
        const created = createGuestSetlist({
          title: payload.title,
          description: payload.description ?? null,
          serviceDate: payload.serviceDate ?? new Date().toISOString(),
          location: payload.location ?? "Main Sanctuary",
          durationMinutes: payload.durationMinutes ?? 45,
          teamName: payload.teamName ?? "Worship Team",
          isPublic: payload.isPublic ?? false,
          presentationLayout: payload.presentationLayout ?? "vertical",
          songs:
            payload.songs?.map((song, idx) => ({
              id: `guest-item-${crypto.randomUUID()}`,
              order: idx,
              songId: song.songId,
              title: song.title,
              artist: song.artist ?? null,
              originalKey: song.originalKey ?? null,
              selectedKey: song.selectedKey ?? song.originalKey ?? null,
              bpm: song.bpm ?? null,
              transitionNotes: song.transitionNotes ?? null,
              notes: song.notes ?? null,
              capo: song.capo ?? null,
              duration: song.duration ?? null,
              arrangement: song.arrangement ?? null,
              version: song.version ?? null,
            })) ?? [],
        });
        if (!created) {
          throw new Error(`Guest setlists จำกัด ${GUEST_SETLIST_LIMIT} รายการ`);
        }
        return created;
      }
      return createSetlist(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setlistQueryKeys.list() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { setlistId: string; payload: PatchSetlistInput }) => {
      if (isGuestContext(accessToken)) {
        const current = guestSetlists.find((row) => row.id === input.setlistId);
        if (!current) throw new Error("Guest setlist not found");
        const next = {
          ...current,
          ...input.payload,
          updatedAt: new Date().toISOString(),
        };
        return useGuestSetlistsStore.getState().saveGuestSetlist(next);
      }
      return updateSetlist(input.setlistId, input.payload);
    },
    onSuccess: (next) => {
      queryClient.setQueryData(setlistQueryKeys.detail(next.id), next);
      queryClient.invalidateQueries({ queryKey: setlistQueryKeys.list() });
    },
  });

  return {
    listQuery,
    createMutation,
    updateMutation,
    removeGuestSetlist,
    canCreateGuestSetlist: guestSetlists.length < GUEST_SETLIST_LIMIT,
    guestSetlistCount: guestSetlists.length,
  };
}

type PatchSetlistInput = Parameters<typeof updateSetlist>[1];

export function usePublicSetlist(slug: string) {
  return useQuery({
    queryKey: setlistQueryKeys.public(slug),
    enabled: Boolean(slug),
    queryFn: () => fetchPublicSetlistBySlug(slug),
    retry: false,
  });
}
