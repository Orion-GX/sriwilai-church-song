"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SongSortValue = "most-used" | "title-asc" | "newest";

type SongResultsToolbarProps = {
  query: string;
  total: number;
  sortBy: SongSortValue;
  onSortChange: (value: SongSortValue) => void;
};

export function SongResultsToolbar({
  query,
  total,
  sortBy,
  onSortChange,
}: SongResultsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-heading-lg md:text-heading-xl">Search Results</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          พบ {total} รายการ
          {query ? (
            <>
              {" "}
              สำหรับ{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{query}&rdquo;
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-utility text-form-label uppercase text-muted-foreground">Sort by</span>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SongSortValue)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="most-used">Most Used</SelectItem>
            <SelectItem value="title-asc">Alphabetical (A-Z)</SelectItem>
            <SelectItem value="newest">Newest Added</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
