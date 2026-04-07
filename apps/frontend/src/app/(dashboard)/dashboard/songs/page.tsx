"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTableCard } from "@/components/dashboard/data-table-card";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SongManagementTable } from "@/components/songs/song-management-table";
import { SongTableToolbar } from "@/components/songs/song-table-toolbar";
import { buttonClassName } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { ApiError } from "@/lib/api/client";
import {
  deleteSong,
  fetchSongAdminList,
  updateSongStatus,
} from "@/lib/api/songs";
import type { SongListItem } from "@/lib/api/types";

const PAGE_LIMIT = 20;

export default function SongManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [searchDraft, setSearchDraft] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );
  const [statusPendingSongId, setStatusPendingSongId] = React.useState<string | null>(
    null,
  );
  const [deletePendingSongId, setDeletePendingSongId] = React.useState<string | null>(
    null,
  );

  const queryKey = ["dashboard", "songs", page, search];
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchSongAdminList({
        page,
        limit: PAGE_LIMIT,
        q: search || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      updateSongStatus(id, next),
    onMutate: ({ id }) => setStatusPendingSongId(id),
    onSettled: () => setStatusPendingSongId(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "songs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSong(id),
    onMutate: (id) => setDeletePendingSongId(id),
    onSettled: () => setDeletePendingSongId(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "songs"] });
    },
  });

  const errorMessage = React.useMemo(() => {
    if (!isError) return null;
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "โหลดรายการเพลงไม่สำเร็จ";
  }, [error, isError]);

  const items = React.useMemo(() => {
    const rows = data?.items ?? [];
    if (statusFilter === "ALL") return rows;
    if (statusFilter === "ACTIVE") return rows.filter((song) => song.isPublished);
    return rows.filter((song) => !song.isPublished);
  }, [data?.items, statusFilter]);

  const total = data?.total ?? 0;
  const limit = data?.limit ?? PAGE_LIMIT;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function onSubmitSearch() {
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function handleToggleStatus(song: SongListItem) {
    const next = !song.isPublished;
    const nextLabel = next ? "ACTIVE" : "INACTIVE";
    const ok = window.confirm(`ยืนยันเปลี่ยนสถานะเพลง "${song.title}" เป็น ${nextLabel} ?`);
    if (!ok) return;
    statusMutation.mutate({ id: song.id, next });
  }

  function handleDelete(song: SongListItem) {
    const ok = window.confirm(
      `ยืนยันลบเพลง "${song.title}" ?\n\nการลบไม่สามารถย้อนกลับได้`,
    );
    if (!ok) return;
    deleteMutation.mutate(song.id);
  }

  return (
    <>
      <SetDashboardTitle title="จัดการเพลง" />
      <PageContainer
        constrained={false}
        className="max-w-[1200px]"
        data-testid="page-song-management"
      >
        <SectionHeader
          title="จัดการเพลง"
          description="จัดการรายการเพลงทั้งหมดในระบบ"
          action={
            <Link
              href="/dashboard/songs/new"
              className={buttonClassName("default", "default")}
              data-testid="song-admin-link-create"
            >
              เพิ่มเพลง
            </Link>
          }
        />

        <DataTableCard
          title="รายการเพลง"
          description={`ทั้งหมด ${total.toLocaleString()} เพลง`}
          className="w-full"
          tableContainerProps={{ className: "overflow-x-auto" }}
        >
          <SongTableToolbar
            searchDraft={searchDraft}
            onSearchDraftChange={setSearchDraft}
            onSearchSubmit={onSubmitSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={(next) => {
              setStatusFilter(next);
              setPage(1);
            }}
            isSearching={isFetching}
          />

          <SongManagementTable
            items={items}
            isLoading={isLoading}
            errorMessage={errorMessage}
            statusPendingSongId={statusPendingSongId}
            deletePendingSongId={deletePendingSongId}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />

          {!isLoading && !isError ? (
            <div className="flex items-center justify-between border-t border-border p-4">
              <p className="text-sm text-muted-foreground">
                หน้า {page} จาก {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={buttonClassName("outline", "sm")}
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  data-testid="song-admin-pagination-prev"
                >
                  ก่อนหน้า
                </button>
                <button
                  type="button"
                  className={buttonClassName("outline", "sm")}
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  data-testid="song-admin-pagination-next"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          ) : null}
        </DataTableCard>
      </PageContainer>
    </>
  );
}
