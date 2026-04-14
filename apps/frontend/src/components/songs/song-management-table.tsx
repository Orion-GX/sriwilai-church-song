"use client";

import { SongRowActions } from "@/components/songs/song-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import * as React from "react";

type SongManagementTableProps = {
  items: SongListItem[];
  isLoading: boolean;
  isFetching?: boolean;
  errorMessage?: string | null;
  sortBy: "title" | "viewCount" | null;
  sortOrder: "ASC" | "DESC" | null;
  onSortChange: (
    sortBy: "title" | "viewCount" | null,
    sortOrder: "ASC" | "DESC" | null,
  ) => void;
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  statusPendingSongId?: string | null;
  deletePendingSongId?: string | null;
  onToggleStatus: (song: SongListItem) => void;
  onDelete: (song: SongListItem) => void;
  onViewSong: (song: SongListItem) => void;
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (next: Record<string, boolean>) => void;
};

export function SongManagementTable({
  items,
  isLoading,
  isFetching = false,
  errorMessage,
  sortBy,
  sortOrder,
  onSortChange,
  page,
  totalPages,
  onPageChange,
  statusPendingSongId,
  deletePendingSongId,
  onToggleStatus,
  onDelete,
  onViewSong,
  rowSelection,
  onRowSelectionChange,
}: SongManagementTableProps) {
  const toggleSort = React.useCallback(
    (column: "title" | "viewCount") => {
      if (sortBy !== column) {
        onSortChange(column, "ASC");
        return;
      }
      if (sortOrder === "ASC") {
        onSortChange(column, "DESC");
        return;
      }
      if (sortOrder === "DESC") {
        onSortChange(null, null);
        return;
      }
      onSortChange(column, "ASC");
    },
    [onSortChange, sortBy, sortOrder],
  );

  const columns = React.useMemo<ColumnDef<SongListItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="เลือกทั้งหมด"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked === true)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`เลือกเพลง ${row.original.title}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        ),
      },
      {
        accessorKey: "title",
        header: () => (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-left font-semibold"
            onClick={() => toggleSort("title")}
            data-testid="song-admin-sort-title"
          >
            ชื่อเพลง
            <span className="text-xs text-muted-foreground">
              {sortBy === "title" && sortOrder === "ASC"
                ? "↑"
                : sortBy === "title" && sortOrder === "DESC"
                  ? "↓"
                  : "↕"}
            </span>
          </button>
        ),
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[280px] font-medium">
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: "originalKey",
        header: "คีย์",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[280px] font-medium">
            {row.original.originalKey}
          </span>
        ),
      },
      {
        id: "category",
        header: "หมวดหมู่",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[180px] text-muted-foreground">
            {row.original.category?.name ?? "-"}
          </span>
        ),
      },
      {
        id: "tags",
        header: "แท็ก",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[240px] text-muted-foreground">
            {row.original.tags.length > 0
              ? row.original.tags.map((tag) => tag.name).join(", ")
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "viewCount",
        header: () => (
          <div className="text-right">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-right font-semibold"
              onClick={() => toggleSort("viewCount")}
              data-testid="song-admin-sort-view-count"
            >
              ยอดดู
              <span className="text-xs text-muted-foreground">
                {sortBy === "viewCount" && sortOrder === "ASC"
                  ? "↑"
                  : sortBy === "viewCount" && sortOrder === "DESC"
                    ? "↓"
                    : "↕"}
              </span>
            </button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right text-muted-foreground">
            {row.original.viewCount.toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "isPublished",
        header: "สถานะ",
        cell: ({ row }) => (
          <Badge
            className="text-xs w-fit px-2 py-1"
            variant={row.original.isPublished ? "success" : "outline"}
          >
            {row.original.isPublished ? "ใช้งาน" : "ปิดใช้งาน"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">การจัดการ</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <SongRowActions
              row={row}
              statusPending={statusPendingSongId === row.original.id}
              deletePending={deletePendingSongId === row.original.id}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [
      deletePendingSongId,
      onDelete,
      onToggleStatus,
      statusPendingSongId,
      sortBy,
      sortOrder,
      toggleSort,
    ],
  );

  const table = useReactTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
  });

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
    <>
      <Table data-testid="song-admin-table">
        <TableHeader className="[&_tr]:border-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-0 hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.original.id}
              className="border-0"
              data-testid={`song-admin-row-${row.original.id}`}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (
                  target.closest(
                    'button, a, input, [role="checkbox"], [data-row-ignore-click="true"]',
                  )
                ) {
                  return;
                }
                onViewSong(row.original);
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-muted-foreground">
          หน้า {page} จาก {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonClassName("outline", "sm")}
            disabled={page <= 1 || isFetching}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            data-testid="song-admin-pagination-prev"
          >
            ก่อนหน้า
          </button>
          <button
            type="button"
            className={buttonClassName("outline", "sm")}
            disabled={page >= totalPages || isFetching}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            data-testid="song-admin-pagination-next"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </>
  );
}
