"use client";

import { DataTableCard } from "@/components/dashboard/data-table-card";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SongManagementTable } from "@/components/songs/song-management-table";
import { SongTableToolbar } from "@/components/songs/song-table-toolbar";
import { buttonClassName } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { ApiError } from "@/lib/api/client";
import {
  deleteSong,
  fetchSongAdminList,
  updateSong,
  updateSongStatus,
} from "@/lib/api/songs";
import type { SongListItem } from "@/lib/api/types";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useCan } from "@/lib/auth/use-can";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";

const PAGE_LIMIT = 10;

export default function SongManagementPage() {
  const canAccessAdmin = useCan(PERMISSIONS.SYSTEM_ADMIN);
  const canManageSongs = useCan(PERMISSIONS.SONG_UPDATE) || canAccessAdmin;
  const canCreateSong = useCan(PERMISSIONS.SONG_CREATE) || canAccessAdmin;
  const currentChurchId = useAuthStore((s) => s.currentChurchId);
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [searchDraft, setSearchDraft] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [statusPendingSongId, setStatusPendingSongId] = React.useState<
    string | null
  >(null);
  const [deletePendingSongId, setDeletePendingSongId] = React.useState<
    string | null
  >(null);
  const [confirmStatusSong, setConfirmStatusSong] =
    React.useState<SongListItem | null>(null);
  const [confirmDeleteSong, setConfirmDeleteSong] =
    React.useState<SongListItem | null>(null);
  const [bulkPending, setBulkPending] = React.useState(false);

  const queryKey = [
    "dashboard",
    "songs",
    currentChurchId ?? "no-church",
    page,
    search,
  ];
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchSongAdminList({
        page,
        limit: PAGE_LIMIT,
        q: search || undefined,
      }),
    enabled: canManageSongs,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      updateSongStatus(id, next),
    onMutate: ({ id }) => setStatusPendingSongId(id),
    onSettled: () => setStatusPendingSongId(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "songs", currentChurchId ?? "no-church"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSong(id),
    onMutate: (id) => setDeletePendingSongId(id),
    onSettled: () => setDeletePendingSongId(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "songs", currentChurchId ?? "no-church"],
      });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({
      action,
      songs,
    }: {
      action: "PUBLISH" | "UNPUBLISH" | "DELETE";
      songs: SongListItem[];
    }) => {
      const selectedIds = songs.map((song) => song.id);
      if (action === "DELETE") {
        await Promise.all(selectedIds.map((id) => deleteSong(id)));
        return;
      }

      const nextPublished = action === "PUBLISH";
      await Promise.all(
        songs
          .filter((song) => song.isPublished !== nextPublished)
          .map((song) => updateSong(song.id, { isPublished: nextPublished })),
      );
    },
    onMutate: () => setBulkPending(true),
    onSettled: () => setBulkPending(false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "songs", currentChurchId ?? "no-church"],
      });
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
    if (statusFilter === "ACTIVE")
      return rows.filter((song) => song.isPublished);
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
    setConfirmStatusSong(song);
  }

  function handleDelete(song: SongListItem) {
    setConfirmDeleteSong(song);
  }

  function handleBulkAction(
    action: "PUBLISH" | "UNPUBLISH" | "DELETE",
    songs: SongListItem[],
  ) {
    if (!songs.length || bulkMutation.isPending) return;
    const actionLabel =
      action === "PUBLISH"
        ? "เปิดใช้งาน"
        : action === "UNPUBLISH"
          ? "ปิดใช้งาน"
          : "ลบ";
    const confirmed = window.confirm(
      `ยืนยัน${actionLabel}เพลงที่เลือกทั้งหมด ${songs.length} รายการใช่หรือไม่?`,
    );
    if (!confirmed) return;
    bulkMutation.mutate({ action, songs });
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
            canCreateSong ? (
              <Link
                href="/dashboard/songs/new"
                className={buttonClassName("default", "default")}
                data-testid="song-admin-link-create"
              >
                เพิ่มเพลง
              </Link>
            ) : null
          }
        />
        {!canManageSongs ? (
          <FormErrorBanner data-testid="song-management-forbidden">
            บัญชีนี้ไม่มีสิทธิ์จัดการเพลง
          </FormErrorBanner>
        ) : null}

        {canManageSongs ? (
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
              isFetching={isFetching}
              errorMessage={errorMessage}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              statusPendingSongId={statusPendingSongId}
              deletePendingSongId={deletePendingSongId}
              bulkPending={bulkPending}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
              onBulkAction={handleBulkAction}
            />
          </DataTableCard>
        ) : null}
      </PageContainer>

      <ConfirmModal
        open={Boolean(confirmStatusSong)}
        title="ยืนยันเปลี่ยนสถานะเพลง"
        description={
          confirmStatusSong ? (
            <>
              เปลี่ยนสถานะเพลง{" "}
              <strong>&quot;{confirmStatusSong.title}&quot;</strong> เป็น{" "}
              <strong>
                {confirmStatusSong.isPublished ? "INACTIVE" : "ACTIVE"}
              </strong>{" "}
              ใช่หรือไม่?
            </>
          ) : undefined
        }
        confirmLabel="ยืนยันเปลี่ยนสถานะ"
        loading={statusMutation.isPending}
        onClose={() => setConfirmStatusSong(null)}
        onConfirm={() => {
          if (!confirmStatusSong) return;
          statusMutation.mutate({
            id: confirmStatusSong.id,
            next: !confirmStatusSong.isPublished,
          });
          setConfirmStatusSong(null);
        }}
      />

      <ConfirmModal
        open={Boolean(confirmDeleteSong)}
        title="ยืนยันลบเพลง"
        description={
          confirmDeleteSong ? (
            <>
              ยืนยันลบเพลง{" "}
              <strong>&quot;{confirmDeleteSong.title}&quot;</strong> ?
              <br />
              การลบไม่สามารถย้อนกลับได้
            </>
          ) : undefined
        }
        confirmLabel="ลบเพลง"
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
        onClose={() => setConfirmDeleteSong(null)}
        onConfirm={() => {
          if (!confirmDeleteSong) return;
          deleteMutation.mutate(confirmDeleteSong.id);
          setConfirmDeleteSong(null);
        }}
      />
    </>
  );
}
