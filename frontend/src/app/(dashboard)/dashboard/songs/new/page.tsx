"use client";

import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SongEditorForm } from "@/components/songs/song-editor-form";

export default function NewSongPage() {
  return (
    <>
      <SetDashboardTitle title="สร้างเพลง" />
      <div
        className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-0"
        data-testid="page-song-new"
      >
        <SongEditorForm mode="create" />
      </div>
    </>
  );
}
