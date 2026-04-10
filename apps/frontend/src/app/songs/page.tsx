"use client";

import { PageContainer } from "@/components/layout/page-container";
import { SiteHeader } from "@/components/layout/site-header";
import { SongFilterSidebar } from "@/components/songs/search-results/song-filter-sidebar";
import { SongResultCard } from "@/components/songs/search-results/song-result-card";
import {
  SongResultsToolbar,
  type SongSortValue,
} from "@/components/songs/search-results/song-results-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchSongCategories,
  fetchSongList,
  fetchSongTagsCatalog,
} from "@/lib/api/songs";
import { useFavoriteSongIds } from "@/lib/stores/favorites-store";
import { useQuery } from "@tanstack/react-query";
import { Filter, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

function parseTagSlugs(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function buildSongsQuery(
  q: string,
  categorySlug: string,
  tagSlugs: string[],
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categorySlug) params.set("categorySlug", categorySlug);
  if (tagSlugs.length > 0) params.set("tagSlugs", tagSlugs.join(","));
  const query = params.toString();
  return query ? `/songs?${query}` : "/songs";
}

export default function SongsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q")?.trim() ?? "";
  const categorySlugFromUrl = searchParams.get("categorySlug")?.trim() ?? "";
  const rawTagSlugsFromUrl = searchParams.get("tagSlugs");
  const tagSlugsFromUrl = React.useMemo(
    () => parseTagSlugs(rawTagSlugsFromUrl),
    [rawTagSlugsFromUrl],
  );

  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState(qFromUrl);
  const [draft, setDraft] = React.useState(qFromUrl);
  const [categorySlug, setCategorySlug] = React.useState(categorySlugFromUrl);
  const [draftCategorySlug, setDraftCategorySlug] =
    React.useState(categorySlugFromUrl);
  const [tagSlugs, setTagSlugs] = React.useState<string[]>(tagSlugsFromUrl);
  const [draftTagSlugs, setDraftTagSlugs] =
    React.useState<string[]>(tagSlugsFromUrl);
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SongSortValue>("most-used");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const favoriteIds = useFavoriteSongIds();

  React.useEffect(() => {
    setQ((prev) => (prev === qFromUrl ? prev : qFromUrl));
    setDraft((prev) => (prev === qFromUrl ? prev : qFromUrl));
    setCategorySlug((prev) =>
      prev === categorySlugFromUrl ? prev : categorySlugFromUrl,
    );
    setDraftCategorySlug((prev) =>
      prev === categorySlugFromUrl ? prev : categorySlugFromUrl,
    );
    setTagSlugs((prev) =>
      prev.join(",") === tagSlugsFromUrl.join(",") ? prev : tagSlugsFromUrl,
    );
    setDraftTagSlugs((prev) =>
      prev.join(",") === tagSlugsFromUrl.join(",") ? prev : tagSlugsFromUrl,
    );
    setPage(1);
  }, [categorySlugFromUrl, qFromUrl, tagSlugsFromUrl]);

  const { data: categories = [] } = useQuery({
    queryKey: ["song-categories-catalog"],
    queryFn: fetchSongCategories,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["song-tags-catalog"],
    queryFn: fetchSongTagsCatalog,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["songs", page, q, categorySlug, tagSlugs.join(",")],
    queryFn: () =>
      fetchSongList({
        page,
        limit: 20,
        q: q || undefined,
        categorySlug: categorySlug || undefined,
        tagSlugs: tagSlugs.length > 0 ? tagSlugs : undefined,
      }),
  });

  const categoryNameBySlug = React.useMemo(
    () => new Map(categories.map((category) => [category.slug, category.name])),
    [categories],
  );

  const hasAppliedFilters = React.useMemo(
    () =>
      q.length > 0 ||
      categorySlug.length > 0 ||
      tagSlugs.length > 0 ||
      favoritesOnly ||
      selectedKey.length > 0,
    [
      categorySlug.length,
      favoritesOnly,
      q.length,
      selectedKey.length,
      tagSlugs.length,
    ],
  );

  function handleSongClick(songId: string) {
    router.push(`/songs/${songId}`);
  }

  const items = React.useMemo(() => {
    if (!data?.items) return [];
    let nextItems = data.items;

    if (selectedKey) {
      nextItems = nextItems.filter((song) => song.originalKey === selectedKey);
    }

    if (favoritesOnly) {
      const set = new Set(favoriteIds);
      nextItems = nextItems.filter((song) => set.has(song.id));
    }

    const collator = new Intl.Collator("th", { sensitivity: "base" });
    nextItems = nextItems.slice().sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return collator.compare(a.title, b.title);
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "most-used":
        default:
          return b.viewCount - a.viewCount;
      }
    });

    return nextItems;
  }, [data?.items, favoriteIds, favoritesOnly, selectedKey, sortBy]);

  function applyFilters(nextQ = draft) {
    const trimmedQ = nextQ.trim();
    setQ(trimmedQ);
    setCategorySlug(draftCategorySlug);
    setTagSlugs(draftTagSlugs);
    setPage(1);
    router.push(buildSongsQuery(trimmedQ, draftCategorySlug, draftTagSlugs));
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters(draft);
  }

  function clearFilters() {
    setDraft("");
    setQ("");
    setDraftCategorySlug("");
    setCategorySlug("");
    setDraftTagSlugs([]);
    setTagSlugs([]);
    setSelectedKey("");
    setFavoritesOnly(false);
    setPage(1);
    router.push("/songs");
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-songs-list">
      <SiteHeader />

      <main>
        <PageContainer maxWidth="layout" className="py-5 md:py-8">
          <form
            onSubmit={onSearch}
            className="mb-5 space-y-3 lg:mb-0 lg:flex lg:items-center lg:gap-3 lg:space-y-0"
            data-testid="song-search-form"
          >
            <div className="relative lg:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search songs, artists..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                data-testid="song-search-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                className="flex-1 lg:flex-none"
                data-testid="song-search-submit"
              >
                ค้นหา
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 lg:hidden"
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <Filter className="mr-2 h-4 w-4" />
                ฟิลเตอร์
              </Button>
            </div>
          </form>

          {filtersOpen ? (
            <SongFilterSidebar
              className="mt-4 lg:hidden"
              categories={categories}
              tags={tags}
              draftCategorySlug={draftCategorySlug}
              draftTagSlugs={draftTagSlugs}
              favoritesOnly={favoritesOnly}
              selectedKey={selectedKey}
              hasAppliedFilters={hasAppliedFilters}
              onCategoryChange={setDraftCategorySlug}
              onTagChange={setDraftTagSlugs}
              onToggleFavorites={() => setFavoritesOnly((v) => !v)}
              onSelectKey={setSelectedKey}
              onApplyFilters={() => applyFilters(draft)}
              onClearFilters={clearFilters}
            />
          ) : null}

          <div className="mt-5 grid gap-6 lg:mt-0 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
            <SongFilterSidebar
              className="hidden lg:block"
              categories={categories}
              tags={tags}
              draftCategorySlug={draftCategorySlug}
              draftTagSlugs={draftTagSlugs}
              favoritesOnly={favoritesOnly}
              selectedKey={selectedKey}
              hasAppliedFilters={hasAppliedFilters}
              onCategoryChange={setDraftCategorySlug}
              onTagChange={setDraftTagSlugs}
              onToggleFavorites={() => setFavoritesOnly((v) => !v)}
              onSelectKey={setSelectedKey}
              onApplyFilters={() => applyFilters(draft)}
              onClearFilters={clearFilters}
            />

            <section className="space-y-5">
              <SongResultsToolbar
                query={q}
                total={items.length}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />

              {hasAppliedFilters ? (
                <div className="flex flex-wrap items-center gap-2">
                  {q ? (
                    <span className="rounded-md bg-surface-low px-2 py-1 text-xs">
                      คำค้น: {q}
                    </span>
                  ) : null}
                  {categorySlug ? (
                    <span className="rounded-md bg-surface-low px-2 py-1 text-xs">
                      หมวด:{" "}
                      {categoryNameBySlug.get(categorySlug) ?? categorySlug}
                    </span>
                  ) : null}
                  {selectedKey ? (
                    <span className="rounded-md bg-surface-low px-2 py-1 text-xs">
                      Key: {selectedKey}
                    </span>
                  ) : null}
                  {favoritesOnly ? (
                    <span className="rounded-md bg-surface-low px-2 py-1 text-xs">
                      เพลงโปรดเท่านั้น
                    </span>
                  ) : null}
                </div>
              ) : null}

              {isLoading ? (
                <ul className="space-y-6" data-testid="song-list-loading">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <li key={i}>
                      <Card>
                        <CardContent className="p-4 md:p-5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="min-w-0 flex-1 space-y-2">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-4 w-full max-w-sm" />
                            </div>
                          </div>
                        </CardContent>
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
                  <ul className="space-y-6" data-testid="song-list">
                    {items.map((song) => (
                      <li key={song.id} data-testid={`song-row-${song.id}`}>
                        <SongResultCard
                          song={song}
                          handleClick={() => handleSongClick(song.id)}
                        />
                      </li>
                    ))}
                  </ul>

                  {items.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title={
                        favoritesOnly ? "ไม่มีเพลงโปรดในหน้านี้" : "ไม่พบเพลง"
                      }
                      description={
                        favoritesOnly
                          ? "ลองปิดตัวกรองหรือเปลี่ยนหน้า"
                          : "ลองปรับคำค้นหา หรือกดล้างตัวกรอง"
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
                        {Math.max(1, Math.ceil(data.total / data.limit))} (
                        {data.total} เพลง)
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

                  {/* <RelatedCollections /> */}
                </>
              )}
            </section>
          </div>
        </PageContainer>
      </main>

      <footer className="mt-14 bg-muted/70">
        <PageContainer maxWidth="layout" className="items-center py-8">
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-wide text-muted-foreground">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Support</span>
            <span>Contact</span>
          </div>
          <p className="text-xs tracking-wide text-muted-foreground">
            © 2024 Sriwilai Song Management
          </p>
        </PageContainer>
      </footer>
    </div>
  );
}
