"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { ChordproView } from "@/components/songs/chordpro-view";
import { FavoriteButton } from "@/components/songs/favorite-button";
import { TransposeBar } from "@/components/songs/transpose-bar";
import { buttonClassName } from "@/components/ui/button";
import { fetchSongById } from "@/lib/api/songs";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function SongDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [transpose, setTranspose] = React.useState(0);
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["song", id],
    queryFn: () => fetchSongById(id),
    enabled: !!id,
  });

  return (
    <div className="flex min-h-screen flex-col" data-testid="page-song-detail">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl flex-1 px-4 py-8">
        <Link
          href="/songs"
          className={buttonClassName("ghost", "default", "mb-6 -ml-2 inline-flex gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          กลับรายการเพลง
        </Link>

        {isLoading ? (
          <p className="text-muted-foreground" data-testid="song-detail-loading">
            กำลังโหลดเพลง…
          </p>
        ) : isError ? (
          <p className="text-destructive" data-testid="song-detail-error">
            โหลดไม่สำเร็จ:{" "}
            {error instanceof Error ? error.message : String(error)}
          </p>
        ) : data ? (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold" data-testid="song-detail-title">
                  {data.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.category?.name ?? "ไม่มีหมวด"}
                  {data.tags.length > 0
                    ? ` · ${data.tags.map((t) => t.name).join(", ")}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 self-start">
                {accessToken ? (
                  <Link
                    href={`/dashboard/songs/${data.id}/edit`}
                    className={buttonClassName("outline", "default", "text-sm")}
                    data-testid="song-link-edit"
                  >
                    แก้ไขเพลง
                  </Link>
                ) : null}
                <FavoriteButton songId={data.id} large className="self-start" />
              </div>
            </div>

            <TransposeBar value={transpose} onChange={setTranspose} className="mb-6" />

            <ChordproView body={data.chordproBody} transposeSemitones={transpose} />
          </>
        ) : null}
      </main>
    </div>
  );
}
