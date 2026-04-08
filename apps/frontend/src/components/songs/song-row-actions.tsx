"use client";

import { Button, buttonClassName } from "@/components/ui/button";
import type { SongListItem } from "@/lib/api/types";
import Link from "next/link";

type SongRowActionsProps = {
  song: SongListItem;
  statusPending?: boolean;
  deletePending?: boolean;
  onToggleStatus: (song: SongListItem) => void;
  onDelete: (song: SongListItem) => void;
};

export function SongRowActions({
  song,
  statusPending = false,
  deletePending = false,
  onToggleStatus,
  onDelete,
}: SongRowActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Link
        href={`/dashboard/songs/${song.id}/edit`}
        className={buttonClassName("outline", "sm", "bg-background")}
        data-testid={`song-admin-edit-${song.id}`}
        style={{
          backgroundColor: "hsl(var(--warning))",
          color: "hsl(var(--warning-foreground))",
        }}
      >
        แก้ไข
      </Link>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={statusPending}
        onClick={() => onToggleStatus(song)}
        data-testid={`song-admin-toggle-status-${song.id}`}
      >
        {song.isPublished ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={deletePending}
        onClick={() => onDelete(song)}
        data-testid={`song-admin-delete-${song.id}`}
      >
        ลบ
      </Button>
    </div>
  );
}
