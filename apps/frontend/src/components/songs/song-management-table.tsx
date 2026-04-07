"use client";

import { Search } from "lucide-react";
import { SongRowActions } from "@/components/songs/song-row-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SongListItem } from "@/lib/api/types";

type SongManagementTableProps = {
  items: SongListItem[];
  isLoading: boolean;
  errorMessage?: string | null;
  statusPendingSongId?: string | null;
  deletePendingSongId?: string | null;
  onToggleStatus: (song: SongListItem) => void;
  onDelete: (song: SongListItem) => void;
};

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export function SongManagementTable({
  items,
  isLoading,
  errorMessage,
  statusPendingSongId,
  deletePendingSongId,
  onToggleStatus,
  onDelete,
}: SongManagementTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4" data-testid="song-admin-table-loading">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-4" data-testid="song-admin-table-error">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Search}
          title="ไม่พบรายการเพลง"
          description="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองสถานะ"
          data-testid="song-admin-table-empty"
        />
      </div>
    );
  }

  return (
    <Table data-testid="song-admin-table">
      <TableHeader>
        <TableRow>
          <TableHead>ชื่อเพลง</TableHead>
          <TableHead>หมวดหมู่</TableHead>
          <TableHead>แท็ก</TableHead>
          <TableHead className="text-right">ยอดดู</TableHead>
          <TableHead>สถานะ</TableHead>
          <TableHead>วันที่สร้าง / อัปเดต</TableHead>
          <TableHead className="text-right">การจัดการ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((song) => (
          <TableRow key={song.id} data-testid={`song-admin-row-${song.id}`}>
            <TableCell className="max-w-[280px] truncate font-medium">{song.title}</TableCell>
            <TableCell className="max-w-[180px] truncate text-muted-foreground">
              {song.category?.name ?? "-"}
            </TableCell>
            <TableCell className="max-w-[240px] truncate text-muted-foreground">
              {song.tags.length > 0 ? song.tags.map((tag) => tag.name).join(", ") : "-"}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {song.viewCount.toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge variant={song.isPublished ? "success" : "secondary"}>
                {song.isPublished ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <div>{formatDateTime(song.createdAt)}</div>
              <div>{formatDateTime(song.updatedAt)}</div>
            </TableCell>
            <TableCell>
              <SongRowActions
                song={song}
                statusPending={statusPendingSongId === song.id}
                deletePending={deletePendingSongId === song.id}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
