"use client";
import { PageContainer } from "@/components/layout/page-container";
import { SiteHeader } from "@/components/layout/site-header";
import { FavoriteButton } from "@/components/songs/favorite-button";
import { SongViewer } from "@/components/songs/viewer/song-viewer";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSongById } from "@/lib/api/songs";
import { buildDisplayDocument } from "@/lib/songs/song-content";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SongDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
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
        <PageContainer maxWidth="layout" className="py-6 md:py-8">
          <Link
            href="/songs"
            className={buttonClassName(
              "ghost",
              "sm",
              "mb-4 inline-flex gap-2 sm:mb-6",
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
                    className="break-words text-page-title"
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
                <div className="flex w-full flex-wrap items-center gap-2 self-start sm:w-auto sm:justify-end">
                  {accessToken ? (
                    <Link
                      href={`/dashboard/songs/${data.id}/edit`}
                      className={buttonClassName("outline", "sm")}
                      data-testid="song-link-edit"
                    >
                      แก้ไขเพลง
                    </Link>
                  ) : null}
                  <FavoriteButton
                    songId={data.id}
                    compactLabel="รายการโปรด"
                    className="self-start"
                  />
                </div>
              </div>

              <SongViewer
                document={buildDisplayDocument(data)}
                title={data.title}
                originalKey={data.originalKey}
                tempo={data.tempo}
                timeSignature={data.timeSignature}
              />
            </>
          ) : null}
        </PageContainer>
      </main>
    </div>
  );
}
