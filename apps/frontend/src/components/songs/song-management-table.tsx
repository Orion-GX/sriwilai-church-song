"use client";

import { SongRowActions } from "@/components/songs/song-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronDown, Search } from "lucide-react";
import * as React from "react";

type SongManagementTableProps = {
  items: SongListItem[];
  isLoading: boolean;
  isFetching?: boolean;
  errorMessage?: string | null;
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  statusPendingSongId?: string | null;
  deletePendingSongId?: string | null;
  bulkPending?: boolean;
  onToggleStatus: (song: SongListItem) => void;
  onDelete: (song: SongListItem) => void;
  onBulkAction: (
    action: "PUBLISH" | "UNPUBLISH" | "DELETE",
    songs: SongListItem[],
  ) => void;
};

export function SongManagementTable({
  items,
  isLoading,
  isFetching = false,
  errorMessage,
  page,
  totalPages,
  onPageChange,
  statusPendingSongId,
  deletePendingSongId,
  bulkPending = false,
  onToggleStatus,
  onDelete,
  onBulkAction,
}: SongManagementTableProps) {
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>(
    {},
  );

  React.useEffect(() => {
    setRowSelection({});
  }, [items, page]);

  const columns = React.useMemo<ColumnDef<SongListItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="เลือกทั้งหมด"
            className="h-4 w-4 accent-primary"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`เลือกเพลง ${row.original.title}`}
            className="h-4 w-4 accent-primary"
            checked={row.getIsSelected()}
            onChange={(event) => row.toggleSelected(event.target.checked)}
          />
        ),
      },
      {
        accessorKey: "title",
        header: "ชื่อเพลง",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[280px] font-medium">
            {row.original.title}
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
        header: () => <div className="text-right">ยอดดู</div>,
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
    [deletePendingSongId, onDelete, onToggleStatus, statusPendingSongId],
  );

  const table = useReactTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedSongs = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);

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
      <div className="flex items-center justify-between border-b border-border p-4">
        <p className="text-sm text-muted-foreground">
          เลือกแล้ว {selectedSongs.length} รายการ
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={buttonClassName("outline", "sm")}
              disabled={selectedSongs.length === 0 || bulkPending}
              data-testid="song-admin-bulk-action-trigger"
            >
              Bulk Action
              <ChevronDown aria-hidden className="ml-2 h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => onBulkAction("PUBLISH", selectedSongs)}
              data-testid="song-admin-bulk-publish"
            >
              เปิดใช้งานที่เลือก
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onBulkAction("UNPUBLISH", selectedSongs)}
              data-testid="song-admin-bulk-unpublish"
            >
              ปิดใช้งานที่เลือก
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onBulkAction("DELETE", selectedSongs)}
              className="text-destructive focus:text-destructive"
              data-testid="song-admin-bulk-delete"
            >
              ลบที่เลือก
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table data-testid="song-admin-table">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
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
              data-testid={`song-admin-row-${row.original.id}`}
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
      <div className="flex items-center justify-between border-t border-border p-4">
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
