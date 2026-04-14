"use client";

import { Button } from "@/components/ui/button";
import { ComboboxChips } from "@/components/ui/combobox-chips";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SongCategoryCatalogItem,
  SongTagCatalogItem,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Filter, Heart, RotateCcw } from "lucide-react";

export const MUSICAL_KEYS = ["C", "G", "D", "A", "E", "B", "F#", "C#"] as const;

type SongFilterSidebarProps = {
  categories: SongCategoryCatalogItem[];
  tags: SongTagCatalogItem[];
  draftCategorySlug: string;
  draftTagSlugs: string[];
  favoritesOnly: boolean;
  selectedKey: string;
  hasAppliedFilters: boolean;
  className?: string;
  onCategoryChange: (slug: string) => void;
  onTagChange: (slugs: string[]) => void;
  onToggleFavorites: () => void;
  onSelectKey: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
};

export function SongFilterSidebar({
  categories,
  tags,
  draftCategorySlug,
  draftTagSlugs,
  favoritesOnly,
  selectedKey,
  hasAppliedFilters,
  className,
  onCategoryChange,
  onTagChange,
  onToggleFavorites,
  onSelectKey,
  onApplyFilters,
  onClearFilters,
}: SongFilterSidebarProps) {
  return (
    <aside className={cn("rounded-lg bg-muted p-4 md:p-5", className)}>
      <div className="mb-5 flex items-center gap-2">
        <Filter className="h-4 w-4 text-primary-fixed-dim" aria-hidden />
        <h2 className="text-base font-semibold tracking-tight">ตัวกรอง</h2>
      </div>

      <div className="space-y-6">
        <section className="space-y-2">
          <p className="text-form-label uppercase text-muted-foreground">
            คีย์เพลง
          </p>
          <Select
            value={selectedKey || "all"}
            onValueChange={(value) => onSelectKey(value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกคีย์เพลง" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกคีย์</SelectItem>
              {MUSICAL_KEYS.map((keyName) => (
                <SelectItem key={keyName} value={keyName}>
                  {keyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-2">
          <p className="text-form-label uppercase text-muted-foreground">
            หมวดหมู่
          </p>
          <Select
            value={draftCategorySlug || "all"}
            onValueChange={(value) =>
              onCategoryChange(value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="ทุกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.code}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-2">
          <p className="text-form-label uppercase text-muted-foreground">
            ป้ายกำกับ
          </p>
          <ComboboxChips
            ariaLabel="เลือกแท็กเพลง"
            value={draftTagSlugs}
            onValueChange={onTagChange}
            multiple
            placeholder="เลือกแท็กเพลง"
            searchPlaceholder="ค้นหาแท็ก..."
            options={tags.map((tag) => ({
              value: tag.code,
              label: tag.name,
            }))}
          />
        </section>

        <section className="space-y-2">
          <Button type="button" className="w-full" onClick={onApplyFilters}>
            ใช้ตัวกรอง
          </Button>
          <Button
            type="button"
            variant={favoritesOnly ? "primary" : "outline"}
            className="w-full"
            onClick={onToggleFavorites}
          >
            <Heart
              className={cn(
                "mr-1 h-2 w-2",
                favoritesOnly ? "text-red-500 fill-red-500" : null,
              )}
              aria-hidden
            />
            เพลงโปรดเท่านั้น
          </Button>
          {hasAppliedFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onClearFilters}
            >
              <RotateCcw className="mr-1 h-2 w-2" aria-hidden />
              ล้างตัวกรองทั้งหมด
            </Button>
          ) : null}
        </section>

        {/* {draftTagSlugs.length > 0 ? (
          <section className="space-y-2">
            <p className="text-form-label uppercase text-muted-foreground">
              แท็กที่เลือก
            </p>
            <div className="flex flex-wrap gap-2">
              {draftTagSlugs.map((slug) => {
                const tagName =
                  tags.find((tag) => tag.slug === slug)?.name ?? slug;
                return (
                  <Badge key={slug} variant="outline" className="rounded-full">
                    {tagName}
                  </Badge>
                );
              })}
            </div>
          </section>
        ) : null} */}
      </div>
    </aside>
  );
}
