"use client";

import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SongEditorForm } from "@/components/songs/song-editor-form";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useCan } from "@/lib/auth/use-can";

export default function NewSongPage() {
  const canCreateSong = useCan(PERMISSIONS.SONG_CREATE);
  return (
    <>
      <SetDashboardTitle title="สร้างเพลง" />
      <PageContainer
        constrained={false}
        className="max-w-4xl"
        data-testid="page-song-new"
      >
        <SectionHeader
          title="สร้างเพลง"
          description="เนื้อ ChordPro — คอร์ดใน [วงเล็บเหลี่ยม]"
        />
        {canCreateSong ? (
          <SongEditorForm mode="create" hideCardHeader />
        ) : (
          <FormErrorBanner data-testid="song-create-forbidden">
            บัญชีนี้ไม่มีสิทธิ์สร้างเพลง
          </FormErrorBanner>
        )}
      </PageContainer>
    </>
  );
}
