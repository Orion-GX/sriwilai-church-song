"use client";

import { PageContainer } from "@/components/layout/page-container";
import { SiteHeader } from "@/components/layout/site-header";
import { FavoriteButton } from "@/components/songs/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ComboboxChips } from "@/components/ui/combobox-chips";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchSongCategories,
  fetchSongList,
  fetchSongTagsCatalog,
} from "@/lib/api/songs";
import { useFavoriteSongIds } from "@/lib/stores/favorites-store";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import Link from "next/link";
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
  const tagNameBySlug = React.useMemo(
    () => new Map(tags.map((tag) => [tag.slug, tag.name])),
    [tags],
  );
  const hasAppliedFilters =
    q.length > 0 || categorySlug.length > 0 || tagSlugs.length > 0;

  const items = React.useMemo(() => {
    if (!data?.items) return [];
    if (!favoritesOnly) return data.items;
    const set = new Set(favoriteIds);
    return data.items.filter((s) => set.has(s.id));
  }, [data?.items, favoritesOnly, favoriteIds]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const nextQ = draft.trim();
    setQ(nextQ);
    setCategorySlug(draftCategorySlug);
    setTagSlugs(draftTagSlugs);
    setPage(1);
    router.push(buildSongsQuery(nextQ, draftCategorySlug, draftTagSlugs));
  }

  function clearFilters() {
    setDraft("");
    setQ("");
    setDraftCategorySlug("");
    setCategorySlug("");
    setDraftTagSlugs([]);
    setTagSlugs([]);
    setPage(1);
    router.push("/songs");
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      data-testid="page-songs-list"
    >
      <SiteHeader />
      <main className="flex-1">
        <PageContainer maxWidth="layout" className="py-6 md:py-8">
          <SectionHeader
            title="เพลง"
            description="รายการเพลง ChordPro จาก API — อ่านได้โดยไม่ต้องล็อกอิน"
          />

          <form
            onSubmit={onSearch}
            className="mb-4 space-y-3"
            data-testid="song-search-form"
          >
            <div className="flex flex-col gap-3 xl:grid xl:grid-cols-10 xl:items-center">
              <div className="flex flex-col gap-3 xl:col-span-9 xl:grid xl:grid-cols-9 xl:items-center">
                <div className="relative xl:col-span-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="bg-white pl-9 dark:bg-card"
                    placeholder="ค้นหาชื่อเพลง…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    data-testid="song-search-input"
                  />
                </div>
                <Select
                  value={draftCategorySlug || "all"}
                  onValueChange={(value) =>
                    setDraftCategorySlug(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger
                    className="w-full bg-white dark:bg-card xl:col-span-2"
                    aria-label="เลือกหมวดหมู่"
                  >
                    <SelectValue placeholder="ทุกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ComboboxChips
                  className="w-full xl:col-span-3"
                  ariaLabel="เลือกแท็ก"
                  value={draftTagSlugs}
                  onValueChange={setDraftTagSlugs}
                  multiple
                  placeholder="เลือกแท็กเพลง"
                  searchPlaceholder="ค้นหาแท็ก..."
                  options={tags.map((tag) => ({
                    value: tag.slug,
                    label: tag.name,
                  }))}
                />
                <Button
                  type="submit"
                  className="w-full xl:col-span-1"
                  data-testid="song-search-submit"
                >
                  ค้นหา
                </Button>
              </div>
              <Button
                type="button"
                variant={favoritesOnly ? "secondary" : "outline"}
                onClick={() => setFavoritesOnly((v) => !v)}
                className="w-full xl:w-auto"
                data-testid="song-filter-favorites"
              >
                รายการโปรด ({favoriteIds.length})
              </Button>
            </div>
          </form>

          {hasAppliedFilters ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {q ? <Badge variant="outline">คำค้น: {q}</Badge> : null}
              {categorySlug ? (
                <Badge variant="secondary">
                  หมวด: {categoryNameBySlug.get(categorySlug) ?? categorySlug}
                </Badge>
              ) : null}
              {tagSlugs.map((slug) => (
                <Badge key={slug} variant="outline">
                  แท็ก: {tagNameBySlug.get(slug) ?? slug}
                </Badge>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                ล้างตัวกรอง
              </Button>
            </div>
          ) : null}

          {isLoading ? (
            <ul className="space-y-2" data-testid="song-list-loading">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i}>
                  <Card>
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 py-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton
                          className="h-4 w-full max-w-md"
                          variant="text"
                        />
                      </div>
                      <Skeleton
                        className="h-9 w-9 shrink-0"
                        variant="circular"
                      />
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
                    <Card className="relative transition-colors hover:bg-muted/40">
                      <CardHeader className="flex flex-row items-center gap-3 space-y-0 py-4">
                        <div className="relative z-10 min-w-0 flex-1">
                          <Link
                            href={`/songs/${song.id}`}
                            className="block truncate font-semibold text-foreground hover:underline"
                            data-testid={`song-list-link-${song.id}`}
                          >
                            {song.title}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">
                            คีย์:{" "}
                            <span className="font-semibold text-foreground">
                              {song.originalKey ?? "-"}
                            </span>
                          </p>
                          {song.category || song.tags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {song.category ? (
                                <Badge variant="secondary">
                                  {song.category.name}
                                </Badge>
                              ) : null}
                              {song.tags.map((tag) => (
                                <Badge key={tag.id} variant="outline">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <FavoriteButton songId={song.id} className="relative z-10" />
                      </CardHeader>
                      <Link
                        href={`/songs/${song.id}`}
                        className="absolute inset-0 z-0"
                        aria-label={`เปิดเพลง ${song.title}`}
                        tabIndex={-1}
                      />
                    </Card>
                  </li>
                ))}
              </ul>

              {items.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={favoritesOnly ? "ไม่มีเพลงโปรดในหน้านี้" : "ไม่พบเพลง"}
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
            </>
          )}
        </PageContainer>
      </main>
    </div>
  );
}
