"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/homepage/container";
import { ComboboxChips } from "@/components/ui/combobox-chips";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchSongCategories, fetchSongTagsCatalog } from "@/lib/api/songs";

type SearchBarProps = {
  placeholder?: string;
};

export function SearchBar({ placeholder = "ค้นหาเพลง..." }: SearchBarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = React.useState("");
  const [categorySlug, setCategorySlug] = React.useState("");
  const [tagSlugs, setTagSlugs] = React.useState<string[]>([]);
  const { data: categories = [] } = useQuery({
    queryKey: ["song-categories-catalog"],
    queryFn: fetchSongCategories,
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["song-tags-catalog"],
    queryFn: fetchSongTagsCatalog,
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = keyword.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categorySlug) params.set("categorySlug", categorySlug);
    if (tagSlugs.length > 0) params.set("tagSlugs", tagSlugs.join(","));
    const query = params.toString();
    router.push(query ? `/songs?${query}` : "/songs");
  }

  return (
    <section className="pt-10 sm:pt-12" aria-label="ค้นหาเพลง">
      <Container>
        <form className="mx-auto max-w-2xl space-y-3" onSubmit={onSubmit}>
          <div className="relative">
            <Input
              type="search"
              name="q"
              placeholder={placeholder}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-12 rounded-xl border-border bg-card pl-4 pr-12 text-body shadow-card placeholder:text-muted-foreground focus-visible:ring-info/40"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground"
              aria-label="ค้นหาเพลง"
            >
              <Search className="size-4" aria-hidden />
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Select
              value={categorySlug || "all"}
              onValueChange={(value) =>
                setCategorySlug(value === "all" ? "" : value)
              }
            >
              <SelectTrigger
                aria-label="เลือกหมวดหมู่เพลง"
                className="w-full bg-white dark:bg-card sm:w-56"
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
              className="sm:flex-1"
              ariaLabel="เลือกแท็กเพลง"
              value={tagSlugs}
              onValueChange={setTagSlugs}
              multiple
              placeholder="เลือกแท็กเพลง"
              searchPlaceholder="ค้นหาแท็ก..."
              options={tags.map((tag) => ({ value: tag.slug, label: tag.name }))}
            />
          </div>
        </form>
      </Container>
    </section>
  );
}
