"use client";

import { Button, buttonClassName } from "@/components/ui/button";
import type { SongListItem } from "@/lib/api/types";
import { Power, PowerOff, SquarePen, Trash2 } from "lucide-react";
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
  const toggleLabel = song.isPublished ? "ปิดใช้งาน" : "เปิดใช้งาน";

  return (
    <div className="flex shrink-0 justify-end gap-1">
      <Link
        href={`/dashboard/songs/${song.id}/edit`}
        className={buttonClassName("outline", "icon", "h-9 w-9 bg-background")}
        data-testid={`song-admin-edit-${song.id}`}
        aria-label="แก้ไข"
        title="แก้ไข"
        style={{
          backgroundColor: "hsl(var(--warning))",
          color: "hsl(var(--warning-foreground))",
        }}
      >
        <SquarePen aria-hidden />
      </Link>
      <Button
        type="button"
        size="icon"
        className="h-9 w-9"
        variant="primary"
        style={{
          backgroundColor: "hsl(var(--success))",
          color: "hsl(var(--success-foreground))",
        }}
        disabled={statusPending}
        onClick={() => onToggleStatus(song)}
        data-testid={`song-admin-toggle-status-${song.id}`}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        {song.isPublished ? (
          <PowerOff aria-hidden />
        ) : (
          <Power aria-hidden />
        )}
      </Button>
      <Button
        type="button"
        size="icon"
        className="h-9 w-9"
        variant="destructive"
        disabled={deletePending}
        onClick={() => onDelete(song)}
        data-testid={`song-admin-delete-${song.id}`}
        aria-label="ลบ"
        title="ลบ"
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}
