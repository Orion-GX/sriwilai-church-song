"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SongListItem } from "@/lib/api/types";
import type { Row } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Power,
  PowerOff,
  SquarePen,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type SongRowActionsProps = {
  row: Row<SongListItem>;
  statusPending?: boolean;
  deletePending?: boolean;
  onToggleStatus: (song: SongListItem) => void;
  onDelete: (song: SongListItem) => void;
};

export function SongRowActions({
  row,
  statusPending = false,
  deletePending = false,
  onToggleStatus,
  onDelete,
}: SongRowActionsProps) {
  const song = row.original;
  const toggleLabel = song.isPublished ? "ปิดใช้งาน" : "เปิดใช้งาน";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          data-testid={`song-admin-row-actions-${song.id}`}
          aria-label="เปิดเมนูการจัดการ"
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/songs/${song.id}?mode=edit`}
            className="cursor-pointer"
            data-testid={`song-admin-edit-${song.id}`}
          >
            <SquarePen aria-hidden className="mr-2 h-4 w-4" />
            แก้ไข
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onToggleStatus(song)}
          disabled={statusPending}
          data-testid={`song-admin-toggle-status-${song.id}`}
        >
          {song.isPublished ? (
            <PowerOff aria-hidden className="mr-2 h-4 w-4" />
          ) : (
            <Power aria-hidden className="mr-2 h-4 w-4" />
          )}
          {toggleLabel}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(song)}
          disabled={deletePending}
          data-testid={`song-admin-delete-${song.id}`}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 aria-hidden className="mr-2 h-4 w-4" />
          ลบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
