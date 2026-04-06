"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { FavoriteButton } from "@/components/songs/favorite-button";
import { PageContainer } from "@/components/layout/page-container";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSongList } from "@/lib/api/songs";
import { useFavoriteSongIds } from "@/lib/stores/favorites-store";

export default function SongsListPage() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const favoriteIds = useFavoriteSongIds();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["songs", page, q],
    queryFn: () => fetchSongList({ page, limit: 20, q: q || undefined }),
  });

  const items = React.useMemo(() => {
    if (!data?.items) return [];
    if (!favoritesOnly) return data.items;
    const set = new Set(favoriteIds);
    return data.items.filter((s) => set.has(s.id));
  }, [data?.items, favoritesOnly, favoriteIds]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(draft.trim());
    setPage(1);
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      data-testid="page-songs-list"
    >
      <SiteHeader />
      <main className="flex-1">
        <PageContainer maxWidth="layout" className="py-8">
          <SectionHeader
            title="เพลง"
            description="รายการเพลง ChordPro จาก API — อ่านได้โดยไม่ต้องล็อกอิน"
          />

          <form
            onSubmit={onSearch}
            className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
            data-testid="song-search-form"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="ค้นหาชื่อเพลง…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                data-testid="song-search-input"
              />
            </div>
            <Button type="submit" data-testid="song-search-submit">
              ค้นหา
            </Button>
            <Button
              type="button"
              variant={favoritesOnly ? "secondary" : "outline"}
              onClick={() => setFavoritesOnly((v) => !v)}
              data-testid="song-filter-favorites"
            >
              เฉพาะโปรด ({favoriteIds.length})
            </Button>
          </form>

          {isLoading ? (
            <ul className="space-y-2" data-testid="song-list-loading">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i}>
                  <Card>
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 py-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full max-w-md" variant="text" />
                      </div>
                      <Skeleton className="h-9 w-9 shrink-0" variant="circular" />
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ul>
          ) : isError ? (
            <p className="text-destructive" data-testid="song-list-error">
              โหลดรายการไม่สำเร็จ:{" "}
              {error instanceof Error ? error.message : String(error)}
            </p>
          ) : (
            <>
              <ul className="space-y-2" data-testid="song-list">
                {items.map((song) => (
                  <li key={song.id} data-testid={`song-row-${song.id}`}>
                    <Card className="transition-colors hover:bg-muted/40">
                      <CardHeader className="flex flex-row items-center gap-3 space-y-0 py-4">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/songs/${song.id}`}
                            className="block truncate font-semibold text-foreground hover:underline"
                            data-testid={`song-list-link-${song.id}`}
                          >
                            {song.title}
                          </Link>
                          <CardDescription className="truncate">
                            {song.category?.name ?? "ไม่มีหมวด"}{" "}
                            {song.tags.length > 0
                              ? `· ${song.tags.map((t) => t.name).join(", ")}`
                              : ""}
                          </CardDescription>
                        </div>
                        <FavoriteButton songId={song.id} />
                      </CardHeader>
                    </Card>
                  </li>
                ))}
              </ul>

              {items.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={
                    favoritesOnly
                      ? "ไม่มีเพลงโปรดในหน้านี้"
                      : "ไม่พบเพลง"
                  }
                  description={
                    favoritesOnly
                      ? "ลองปิดตัวกรองหรือเปลี่ยนหน้า"
                      : "ลองปรับคำค้นหา"
                  }
                  data-testid="song-list-empty"
                />
              ) : null}

              {data && data.total > data.limit ? (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ก่อนหน้า
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    หน้า {page} /{" "}
                    {Math.max(1, Math.ceil(data.total / data.limit))} ({data.total}{" "}
                    เพลง)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page * data.limit >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    ถัดไป
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </PageContainer>
      </main>
    </div>
  );
}
