"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { SiteHeader } from "@/components/layout/site-header";
import { ChordproView } from "@/components/songs/chordpro-view";
import { FavoriteButton } from "@/components/songs/favorite-button";
import { TransposeBar } from "@/components/songs/transpose-bar";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div
      className="flex min-h-screen flex-col bg-background"
      data-testid="page-song-detail"
    >
      <SiteHeader />
      <main className="flex-1">
        <PageContainer maxWidth="layout" className="py-8">
          <Link
            href="/songs"
            className={buttonClassName(
              "ghost",
              "default",
              "mb-6 -ml-2 inline-flex gap-2",
            )}
            data-testid="song-back-list"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับรายการเพลง
          </Link>

          {isLoading ? (
            <div className="space-y-6" data-testid="song-detail-loading">
              <div className="space-y-2">
                <Skeleton className="h-9 w-2/3 max-w-md" />
                <Skeleton className="h-4 w-1/2 max-w-sm" variant="text" />
              </div>
              <Skeleton className="h-10 w-full max-w-xl" />
              <Card>
                <CardContent className="space-y-3 p-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            </div>
          ) : isError ? (
            <FormErrorBanner data-testid="song-detail-error">
              โหลดไม่สำเร็จ:{" "}
              {error instanceof Error ? error.message : String(error)}
            </FormErrorBanner>
          ) : data ? (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1
                    className="text-page-title"
                    data-testid="song-detail-title"
                  >
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
                      className={buttonClassName("outline", "sm")}
                      data-testid="song-link-edit"
                    >
                      แก้ไขเพลง
                    </Link>
                  ) : null}
                  <FavoriteButton songId={data.id} large className="self-start" />
                </div>
              </div>

              <TransposeBar
                value={transpose}
                onChange={setTranspose}
                className="mb-6"
              />

              <ChordproView body={data.chordproBody} transposeSemitones={transpose} />
            </>
          ) : null}
        </PageContainer>
      </main>
    </div>
  );
}
