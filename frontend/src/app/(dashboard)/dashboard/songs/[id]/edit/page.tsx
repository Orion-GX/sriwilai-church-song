"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SongEditorForm } from "@/components/songs/song-editor-form";
import { fetchSongById } from "@/lib/api/songs";

export default function EditSongPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["song", id, "edit"],
    queryFn: () => fetchSongById(id),
    enabled: !!id,
  });

  return (
    <>
      <SetDashboardTitle title="แก้ไขเพลง" />
      <div
        className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-0"
        data-testid="page-song-edit"
      >
        {isLoading ? (
          <p className="text-muted-foreground" data-testid="song-edit-loading">
            กำลังโหลดเพลง…
          </p>
        ) : isError ? (
          <p className="text-destructive" data-testid="song-edit-error">
            โหลดไม่สำเร็จ:{" "}
            {error instanceof Error ? error.message : String(error)}
          </p>
        ) : data ? (
          <SongEditorForm
            mode="edit"
            songId={data.id}
            initialTitle={data.title}
            initialChordpro={data.chordproBody}
          />
        ) : null}
      </div>
    </>
  );
}
