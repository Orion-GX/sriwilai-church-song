"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/homepage/container";
import { badgeVariants } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchSongCategories, fetchSongTagsCatalog } from "@/lib/api/songs";
import { cn } from "@/lib/utils";

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

  function toggleTagSlug(slug: string) {
    setTagSlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug],
    );
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
          <div className="grid grid-cols-1 gap-3">
            <Select
              value={categorySlug || "all"}
              onValueChange={(value) =>
                setCategorySlug(value === "all" ? "" : value)
              }
            >
              <SelectTrigger aria-label="เลือกหมวดหมู่เพลง">
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
            {tags.length > 0 ? (
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  เลือกแท็ก (เลือกได้หลายแท็ก)
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = tagSlugs.includes(tag.slug);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTagSlug(tag.slug)}
                        className={cn(
                          badgeVariants({
                            variant: selected ? "secondary" : "outline",
                          }),
                          "cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-medium",
                        )}
                      >
                        {selected ? (
                          <Check className="mr-1 inline h-3 w-3" aria-hidden />
                        ) : null}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </form>
      </Container>
    </section>
  );
}
