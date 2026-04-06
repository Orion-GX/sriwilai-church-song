"use client";

import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SongEditorForm } from "@/components/songs/song-editor-form";
import { SectionHeader } from "@/components/ui/section-header";

export default function NewSongPage() {
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
        <SongEditorForm mode="create" hideCardHeader />
      </PageContainer>
    </>
  );
}
