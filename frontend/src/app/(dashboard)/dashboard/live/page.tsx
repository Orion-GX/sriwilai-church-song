"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Radio, Plus } from "lucide-react";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createLiveSession, fetchLiveSessions } from "@/lib/api/live";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function LiveSessionsListPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = React.useState("");
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["liveSessions"],
    queryFn: () => fetchLiveSessions(),
    enabled: !!user,
  });

  const createMut = useMutation({
    mutationFn: () => {
      const t = title.trim();
      if (t.length < 2) {
        throw new Error("ชื่อห้องต้องมีอย่างน้อย 2 ตัวอักษร");
      }
      return createLiveSession({ title: t });
    },
    onSuccess: () => {
      setTitle("");
      setCreateErr(null);
      void queryClient.invalidateQueries({ queryKey: ["liveSessions"] });
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
      <SetDashboardTitle title="ไลฟ์" />
      <div className="mx-auto max-w-3xl space-y-8" data-testid="page-live-list">
        <div className="flex items-center gap-3">
          <Radio className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">เซสชันไลฟ์</h2>
            <p className="text-sm text-muted-foreground">
              สร้างห้องให้วงหรือทีม worship — ต้องมีสิทธิ์ LIVE_MANAGE / LIVE_READ
            </p>
          </div>
        </div>

        {!user ? (
          <p className="text-muted-foreground">
            กรุณา{" "}
            <Link href="/login" className="text-primary underline">
              เข้าสู่ระบบ
            </Link>{" "}
            เพื่อดูเซสชัน
          </p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                สร้างเซสชันใหม่
              </CardTitle>
              <CardDescription>
                ตั้งชื่อห้องแล้วกดสร้าง (ต้องมีสิทธิ์จัดการไลฟ์)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createErr ? (
                <p className="text-sm text-destructive">{createErr}</p>
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
        )}

        <div>
          <h3 className="mb-3 text-lg font-medium">เซสชันที่กำลังเปิด</h3>
          {isLoading ? (
            <p className="text-muted-foreground">กำลังโหลด…</p>
          ) : isError ? (
            <p className="text-destructive">
              โหลดไม่สำเร็จ:{" "}
              {error instanceof Error ? error.message : String(error)}
            </p>
          ) : !data?.length ? (
            <p className="text-muted-foreground">ยังไม่มีเซสชันที่ active</p>
          ) : (
            <ul className="space-y-2">
              {data.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/live/${s.id}`}
                    className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                  >
                    <span className="font-semibold">{s.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {s.status}
                      {s.leaderUserId
                        ? ` · leader ${s.leaderUserId.slice(0, 8)}…`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" className="mt-4" type="button" onClick={() => refetch()}>
            รีเฟรช
          </Button>
        </div>
      </div>
    </>
  );
}
