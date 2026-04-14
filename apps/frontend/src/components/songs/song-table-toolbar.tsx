"use client";

import { Button, buttonClassName } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, HashIcon, Music2, ShapesIcon } from "lucide-react";

type IconProps = {
  className?: string;
};

function SolidSearchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 3.474 9.765l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 9 3.5Zm-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type SongTableToolbarProps = {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onClearSearch: () => void;
  categoryFilter?: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: Array<{ value: string; label: string }>;
  keyFilter?: string;
  onKeyFilterChange: (value: string) => void;
  keyOptions: Array<{ value: string; label: string }>;
  tagFilter?: string;
  onTagFilterChange: (value: string) => void;
  tagOptions: Array<{ value: string; label: string }>;
  selectedCount: number;
  bulkPending?: boolean;
  onBulkAction: (action: "PUBLISH" | "UNPUBLISH" | "DELETE") => void;
};

export function SongTableToolbar({
  searchDraft,
  onSearchDraftChange,
  onClearSearch,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  keyFilter,
  onKeyFilterChange,
  keyOptions,
  tagFilter,
  onTagFilterChange,
  tagOptions,
  selectedCount,
  bulkPending = false,
  onBulkAction,
}: SongTableToolbarProps) {
  return (
    <div className="border-b border-border p-4">
      <div className="grid grid-cols-5 gap-2 min-[1500px]:grid-cols-9">
        <div className="relative col-span-5 w-full md:col-span-3 min-[1500px]:col-span-3">
          <SolidSearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            placeholder="ค้นหาชื่อเพลง..."
            className="pl-9"
            data-testid="song-admin-search-input"
          />
        </div>

        <Select
          value={categoryFilter ?? ""}
          onValueChange={onCategoryFilterChange}
        >
          <SelectTrigger
            className="col-span-5 h-10 md:col-span-2 min-[1500px]:col-span-2"
            data-testid="song-admin-category-filter"
          >
            <div className="flex items-center gap-2">
              <ShapesIcon className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="หมวดหมู่" />
            </div>
          </SelectTrigger>
          <SelectContent position="popper" align="end" sideOffset={4}>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={keyFilter ?? ""} onValueChange={onKeyFilterChange}>
          <SelectTrigger
            className="col-span-5 h-10 sm:col-span-2 md:col-span-1 min-[1500px]:col-span-1"
            data-testid="song-admin-key-filter"
          >
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="คีย์" />
            </div>
          </SelectTrigger>
          <SelectContent position="popper" align="end" sideOffset={4}>
            {keyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter ?? ""} onValueChange={onTagFilterChange}>
          <SelectTrigger
            className="col-span-5 h-10 sm:col-span-2 md:col-span-2 min-[1500px]:col-span-1"
            data-testid="song-admin-tag-filter"
          >
            <div className="flex items-center gap-2">
              <HashIcon className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="ป้ายกำกับ" />
            </div>
          </SelectTrigger>
          <SelectContent position="popper" align="end" sideOffset={4}>
            {tagOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="primary"
          size="default"
          className="col-span-5 h-10 sm:col-span-1 md:col-span-1 min-[1500px]:col-span-1"
          onClick={onClearSearch}
          data-testid="song-admin-clear-search"
        >
          ล้างการค้นหา
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`${buttonClassName("outline", "sm")} col-span-5 h-10 justify-between sm:col-span-1 md:col-span-1 min-[1500px]:col-span-1`}
              disabled={selectedCount === 0 || bulkPending}
              data-testid="song-admin-bulk-action-trigger"
            >
              <span className="inline-flex items-center gap-2">
                {/* <HashtagIcon className="h-4 w-4 text-muted-foreground" /> */}
                จัดการที่เลือก
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectedCount}
                </span>
                <ChevronDown aria-hidden className="h-4 w-4" />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => onBulkAction("PUBLISH")}
              data-testid="song-admin-bulk-publish"
            >
              เปิดใช้งานที่เลือก
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onBulkAction("UNPUBLISH")}
              data-testid="song-admin-bulk-unpublish"
            >
              ปิดใช้งานที่เลือก
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onBulkAction("DELETE")}
              className="text-destructive focus:text-destructive"
              data-testid="song-admin-bulk-delete"
            >
              ลบที่เลือก
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
