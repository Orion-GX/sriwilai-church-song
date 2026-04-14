"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SongEditorForm } from "@/components/songs/song-editor-form";
import { Card, CardContent } from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useCan } from "@/lib/auth/use-can";
import { fetchSongById } from "@/lib/api/songs";

export default function EditSongPage() {
  const canEditSong = useCan(PERMISSIONS.SONG_UPDATE);
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["song", id, "edit"],
    queryFn: () => fetchSongById(id),
    enabled: !!id && canEditSong,
  });

  return (
    <>
      <SetDashboardTitle title="แก้ไขเพลง" />
      <PageContainer
        constrained={false}
        className="max-w-[1280px]"
        data-testid="page-song-edit"
      >
        <SectionHeader
          title="แก้ไขเพลง"
          description="เนื้อ ChordPro — คอร์ดใน [วงเล็บเหลี่ยม]"
        />
        {!canEditSong ? (
          <FormErrorBanner data-testid="song-edit-forbidden">
            บัญชีนี้ไม่มีสิทธิ์แก้ไขเพลง
          </FormErrorBanner>
        ) : isLoading ? (
          <Card data-testid="song-edit-loading">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="min-h-[280px] w-full" />
            </CardContent>
          </Card>
        ) : isError ? (
          <FormErrorBanner data-testid="song-edit-error">
            โหลดไม่สำเร็จ:{" "}
            {error instanceof Error ? error.message : String(error)}
          </FormErrorBanner>
        ) : data ? (
          <SongEditorForm
            mode="edit"
            songId={data.id}
            initialTitle={data.title}
            initialChordpro={data.chordproBody}
            initialVersions={data.versions}
            initialCategory={data.category}
            initialTagSlugs={data.tags.map((t) => t.slug)}
            initialOriginalKey={data.originalKey}
            initialTempo={data.tempo}
            initialTimeSignature={data.timeSignature}
            initialCoverImageUrl={data.coverImageUrl}
            hideCardHeader
          />
        ) : null}
      </PageContainer>
    </>
  );
}
