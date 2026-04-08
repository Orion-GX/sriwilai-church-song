"use client";

import { useId } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SongTableToolbarProps = {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onStatusFilterChange: (status: "ALL" | "ACTIVE" | "INACTIVE") => void;
  isSearching?: boolean;
};

export function SongTableToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
  isSearching = false,
}: SongTableToolbarProps) {
  const statusLabelId = useId();

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full gap-2 sm:max-w-lg">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearchSubmit();
              }
            }}
            placeholder="ค้นหาชื่อเพลง..."
            className="pl-9"
            data-testid="song-admin-search-input"
          />
        </div>
        <Button
          type="button"
          onClick={onSearchSubmit}
          disabled={isSearching}
          data-testid="song-admin-search-submit"
        >
          ค้นหา
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="shrink-0 text-sm text-muted-foreground"
          id={statusLabelId}
        >
          สถานะ
        </span>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            onStatusFilterChange(v as "ALL" | "ACTIVE" | "INACTIVE")
          }
        >
          <SelectTrigger
            className="h-10 w-[min(100%,11rem)] sm:w-44"
            data-testid="song-admin-status-filter"
            aria-labelledby={statusLabelId}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end" sideOffset={4}>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
            <SelectItem value="INACTIVE">ไม่ใช้งาน</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
