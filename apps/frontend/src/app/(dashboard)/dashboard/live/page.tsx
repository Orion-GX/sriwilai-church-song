"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createAdminLiveSession, fetchAdminLiveSessions } from "@/lib/api/live";
import { ApiError } from "@/lib/api/client";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useCan } from "@/lib/auth/use-can";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function LiveSessionsListPage() {
  const queryClient = useQueryClient();
  const canReadLive = useCan(PERMISSIONS.LIVE_READ);
  const canManageLive = useCan(PERMISSIONS.LIVE_MANAGE);
  const user = useAuthStore((s) => s.user);
  const currentChurchId = useAuthStore((s) => s.currentChurchId);
  const [title, setTitle] = React.useState("");
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard", "liveSessions", currentChurchId ?? "no-church"],
    queryFn: () => fetchAdminLiveSessions(),
    enabled: !!user && canReadLive,
  });

  const createMut = useMutation({
    mutationFn: () => {
      const t = title.trim();
      if (t.length < 2) {
        throw new Error("ชื่อห้องต้องมีอย่างน้อย 2 ตัวอักษร");
      }
      return createAdminLiveSession({ title: t });
    },
    onSuccess: () => {
      setTitle("");
      setCreateErr(null);
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", "liveSessions", currentChurchId ?? "no-church"],
      });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "สร้างเซสชันไม่สำเร็จ";
      setCreateErr(msg);
    },
  });

  return (
    <>
      <SetDashboardTitle title="เซสชันไลฟ์" />
      <PageContainer
        constrained={false}
        className="max-w-3xl"
        data-testid="page-live-list"
      >
        <SectionHeader
          title="เซสชันไลฟ์"
          description="สร้างห้องให้วงหรือทีม worship — ต้องมีสิทธิ์ LIVE_MANAGE / LIVE_READ"
        />

        {!user ? (
          <Card variant="flat">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              กรุณา{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                เข้าสู่ระบบ
              </Link>{" "}
              เพื่อดูเซสชัน
            </CardContent>
          </Card>
        ) : canManageLive ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Plus className="h-5 w-5 shrink-0" aria-hidden />
                สร้างเซสชันใหม่
              </CardTitle>
              <CardDescription>
                ตั้งชื่อห้องแล้วกดสร้าง (ต้องมีสิทธิ์จัดการไลฟ์)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createErr ? (
                <FormErrorBanner className="text-sm">{createErr}</FormErrorBanner>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="live-title">ชื่อห้อง</Label>
                <Input
                  id="live-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น นมัสการเช้า — 7 เม.ย."
                  data-testid="live-create-title"
                />
              </div>
              <Button
                type="button"
                disabled={createMut.isPending}
                data-testid="live-create-submit"
                onClick={() => createMut.mutate()}
              >
                {createMut.isPending ? "กำลังสร้าง…" : "สร้างเซสชัน"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!canReadLive && user ? (
          <FormErrorBanner data-testid="live-list-forbidden">
            บัญชีนี้ไม่มีสิทธิ์เข้าถึงเซสชันไลฟ์
          </FormErrorBanner>
        ) : null}

        {canReadLive ? (
          <section className="space-y-4" aria-labelledby="live-open-heading">
          <h2 id="live-open-heading" className="text-section-title">
            เซสชันที่กำลังเปิด
          </h2>
          {isLoading ? (
            <ul className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i}>
                  <Card>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="mt-2 h-3 w-32" variant="text" />
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          ) : isError ? (
            <FormErrorBanner>
              โหลดไม่สำเร็จ:{" "}
              {error instanceof Error ? error.message : String(error)}
            </FormErrorBanner>
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีเซสชันที่ active
            </p>
          ) : (
            <ul className="space-y-2">
              {data.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/live/${s.id}`}
                    className="block rounded-lg border border-border bg-card shadow-card transition-colors hover:bg-muted/50"
                  >
                    <Card className="border-0 shadow-none">
                      <CardContent className="p-4">
                        <span className="font-semibold text-foreground">
                          {s.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {s.status}
                          {s.leaderUserId
                            ? ` · leader ${s.leaderUserId.slice(0, 8)}…`
                            : ""}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="outline"
            className="mt-2"
            type="button"
            onClick={() => refetch()}
          >
            รีเฟรช
          </Button>
          </section>
        ) : null}
      </PageContainer>
    </>
  );
}
