"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { ApiError } from "@/lib/api/client";
import { fetchAdminDashboard } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatShortDate(iso: string) {
  const d = new Date(iso + "T12:00:00.000Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: fetchAdminDashboard,
  });

  const forbidden = error instanceof ApiError && error.status === 403;

  return (
    <>
      <SetDashboardTitle title="แดชบอร์ดแอดมิน" />
      <PageContainer
        constrained={false}
        className="max-w-6xl"
        data-testid="page-admin-dashboard"
      >
        <SectionHeader
          title="แดชบอร์ดแอดมิน"
          description="สรุปเพลง ผู้ใช้ และเซสชันไลฟ์ (ต้องมีสิทธิ์ system.admin)"
          action={
            <Button
              type="button"
              variant="outline"
              data-testid="admin-dashboard-refresh"
              onClick={() => void refetch()}
            >
              รีเฟรช
            </Button>
          }
        />

        {isLoading ? (
          <Card data-testid="admin-dashboard-loading">
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-full max-w-lg" variant="text" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : forbidden ? (
          <Card
            className="border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/40"
            data-testid="admin-dashboard-forbidden"
          >
            <CardHeader>
              <CardTitle className="text-lg text-amber-900 dark:text-amber-100">
                ไม่มีสิทธิ์เข้าถึง
              </CardTitle>
              <CardDescription className="text-amber-900/90 dark:text-amber-100/90">
                บัญชีของคุณต้องมี permission{" "}
                <code className="rounded bg-muted px-1 text-foreground">
                  system.admin
                </code>{" "}
                จึงจะดูแดชบอร์ดนี้ได้
              </CardDescription>
            </CardHeader>
          </Card>
        ) : isError ? (
          <FormErrorBanner data-testid="admin-dashboard-error">
            โหลดไม่สำเร็จ:{" "}
            {error instanceof Error ? error.message : String(error)}
          </FormErrorBanner>
        ) : data ? (
          <div data-testid="admin-dashboard-content">
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="admin-stats-grid"
            >
              <AdminStatCard
                title="เพลงทั้งหมด"
                value={data.songsTotal.toLocaleString()}
                data-testid="admin-stat-songs-total"
              />
              <AdminStatCard
                title="เพลงใหม่ (7 วัน)"
                value={data.songsNewLast7Days.toLocaleString()}
                hint={`30 วัน: ${data.songsNewLast30Days.toLocaleString()} เพลง`}
                data-testid="admin-stat-songs-new"
              />
              <AdminStatCard
                title="ผู้ใช้ทั้งหมด"
                value={data.usersTotal.toLocaleString()}
                hint={`ใหม่ 7 วัน: ${data.usersNewLast7Days.toLocaleString()}`}
                data-testid="admin-stat-users-total"
              />
              <AdminStatCard
                title="ห้องไลฟ์ที่เปิดอยู่"
                value={data.liveActiveSessions.toLocaleString()}
                hint={`ทั้งหมดในประวัติ: ${data.liveSessionsTotal.toLocaleString()}`}
                data-testid="admin-stat-live-active"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2" data-testid="admin-charts-grid">
              <Card data-testid="admin-chart-songs-by-day">
                <CardHeader>
                  <CardTitle>เพลงที่สร้างรายวัน (14 วัน)</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.songsCreatedByDay}>
                      <defs>
                        <linearGradient id="fillSong" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(l) => String(l)}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="เพลงใหม่"
                        stroke="hsl(var(--primary))"
                        fill="url(#fillSong)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card data-testid="admin-chart-top-songs">
                <CardHeader>
                  <CardTitle>เพลงยอดนิยม (เปิดดู)</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {data.topViewedSongs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      ยังไม่มีการนับการดู — มีเมื่อมีคนเปิดหน้ารายละเอียดเพลง
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.topViewedSongs}
                        layout="vertical"
                        margin={{ left: 8, right: 16 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                          horizontal={false}
                        />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="title"
                          width={100}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) =>
                            String(v).length > 14
                              ? `${String(v).slice(0, 14)}…`
                              : String(v)
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))",
                          }}
                        />
                        <Bar
                          dataKey="viewCount"
                          name="จำนวนครั้งที่เปิด"
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card data-testid="admin-live-sessions-card">
              <CardHeader>
                <CardTitle>เซสชันไลฟ์ล่าสุด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table data-testid="admin-live-sessions-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ชื่อ</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>Leader</TableHead>
                        <TableHead>สร้างเมื่อ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.liveRecentSessions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/live/${s.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {s.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                s.status === "active"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : ""
                              }
                            >
                              {s.status}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {s.leaderUserId.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(s.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {data.liveRecentSessions.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    ยังไม่มีเซสชัน
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card variant="flat" data-testid="admin-dashboard-footnote">
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">เพลงยอดนิยม</strong> มาจาก{" "}
                  <code className="rounded bg-muted px-1">view_count</code> ที่เพิ่มทุกครั้งที่มีการเปิดหน้ารายละเอียดเพลง (public API)
                </p>
              </CardContent>
            </Card>

            <Card
              variant="flat"
              className="border-dashed"
              data-testid="admin-audit-summary"
            >
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">บันทึกตรวจสอบ (audit)</p>
                <p className="mt-2">
                  ยังไม่มีหน้ารายการ audit log ในเว็บ — ข้อมูลถูกเก็บที่เซิร์ฟเวอร์ (ตาราง audit)
                  หากเปิด API/UI รายการภายหลัง ให้ผูกทดสอบที่นี่
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
