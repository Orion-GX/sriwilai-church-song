"use client";

import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SongEditorForm } from "@/components/songs/song-editor-form";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSongAdminById } from "@/lib/api/songs";
import { fetchUserById } from "@/lib/api/users";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useCan } from "@/lib/auth/use-can";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

export default function SongAdminDetailPage() {
  const canAccessAdmin = useCan(PERMISSIONS.SYSTEM_ADMIN);
  const canViewSong = useCan(PERMISSIONS.SONG_UPDATE) || canAccessAdmin;
  const canEditSong = useCan(PERMISSIONS.SONG_UPDATE) || canAccessAdmin;
  const me = useAuthStore((s) => s.user);
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = typeof params.id === "string" ? params.id : "";
  const isDashboardRoute = pathname.startsWith("/dashboard/");
  const isEditMode = searchParams.get("mode") === "edit";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", "songs", id, "detail"],
    queryFn: () => fetchSongAdminById(id),
    enabled: !!id && canViewSong && isDashboardRoute,
  });

  const updatedById = data?.updatedBy ?? null;
  const { data: updatedByUser } = useQuery({
    queryKey: ["dashboard", "songs", "updated-by-user", updatedById],
    queryFn: () => fetchUserById(updatedById as string),
    enabled: Boolean(updatedById) && canAccessAdmin,
    retry: false,
  });

  const lastUpdatedText = React.useMemo(() => {
    if (!data) return "";
    const parsedDate = new Date(data.updatedAt);
    const updatedAtLabel = Number.isNaN(parsedDate.getTime())
      ? data.updatedAt
      : new Intl.DateTimeFormat("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(parsedDate);
    const fromMe = data.updatedBy && me?.id === data.updatedBy ? me.displayName : null;
    const fromLookup = updatedByUser?.displayName?.trim() || null;
    const updatedByLabel =
      fromMe || fromLookup || data.updatedBy?.trim() || "ไม่ระบุผู้แก้ไข";
    return `แก้ไขล่าสุด ${updatedAtLabel} โดย ${updatedByLabel}`;
  }, [data, me?.displayName, me?.id, updatedByUser?.displayName]);

  return (
    <>
      <SetDashboardTitle title="รายละเอียดเพลง" />
      <PageContainer
        constrained={false}
        className="max-w-[1280px]"
        data-testid="page-song-admin-detail"
      >
        <SectionHeader
          title={isEditMode ? "แก้ไขเพลง" : "รายละเอียดเพลง"}
          description={
            isEditMode
              ? "แก้ไขข้อมูลเพลง"
              : "แสดงข้อมูลเพลงแบบอ่านอย่างเดียว"
          }
          action={
            data && (isEditMode || canEditSong) ? (
              <Link
                href={
                  isEditMode
                    ? `/dashboard/songs/${data.id}`
                    : `/dashboard/songs/${data.id}?mode=edit`
                }
                className={buttonClassName("default", "default")}
                data-testid={isEditMode ? "song-admin-link-view" : "song-admin-link-edit"}
              >
                {isEditMode ? "ดูรายละเอียด" : "แก้ไขเพลง"}
              </Link>
            ) : null
          }
        />
        {!isEditMode && data ? (
          <p className="mb-4 text-sm text-muted-foreground">{lastUpdatedText}</p>
        ) : null}

        {!canViewSong || !isDashboardRoute ? (
          <FormErrorBanner data-testid="song-admin-detail-forbidden">
            บัญชีนี้ไม่มีสิทธิ์ดูรายละเอียดเพลง
          </FormErrorBanner>
        ) : isEditMode && !canEditSong ? (
          <FormErrorBanner data-testid="song-admin-edit-forbidden">
            บัญชีนี้ไม่มีสิทธิ์แก้ไขเพลง
          </FormErrorBanner>
        ) : isLoading ? (
          <Card data-testid="song-admin-detail-loading">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-8 w-full max-w-md" />
              <Skeleton className="h-4 w-80" />
              <Skeleton className="min-h-[320px] w-full" />
            </CardContent>
          </Card>
        ) : isError ? (
          <FormErrorBanner data-testid="song-admin-detail-error">
            โหลดไม่สำเร็จ: {error instanceof Error ? error.message : String(error)}
          </FormErrorBanner>
        ) : data ? (
          <SongEditorForm
            mode="edit"
            songId={data.id}
            initialTitle={data.title}
            initialChordpro={data.chordproBody}
            initialVersions={data.versions}
            initialCategory={data.category}
            initialTagCodes={data.tags.map((t) => t.code)}
            initialOriginalKey={data.originalKey}
            initialTempo={data.tempo}
            initialTimeSignature={data.timeSignature}
            initialCoverImageUrl={data.coverImageUrl}
            hideCardHeader
            readOnly={!isEditMode}
          />
        ) : null}
      </PageContainer>
    </>
  );
}
