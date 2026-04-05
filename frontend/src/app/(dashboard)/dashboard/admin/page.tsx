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
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { ApiError } from "@/lib/api/client";
import { fetchAdminDashboard } from "@/lib/api/admin";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <SetDashboardTitle title="แอดมิน" />
      <div className="mx-auto max-w-6xl space-y-8" data-testid="page-admin-dashboard">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">แดชบอร์ดแอดมิน</h2>
            <p className="text-sm text-muted-foreground">
              สรุปเพลง ผู้ใช้ และเซสชันไลฟ์ (ต้องมีสิทธิ์ system.admin)
            </p>
          </div>
          <button
            type="button"
            className={buttonClassName("outline", "default")}
            data-testid="admin-dashboard-refresh"
            onClick={() => void refetch()}
          >
            รีเฟรช
          </button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground" data-testid="admin-dashboard-loading">
            กำลังโหลดข้อมูล…
          </p>
        ) : forbidden ? (
          <div
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-6 text-amber-800 dark:text-amber-200"
            data-testid="admin-dashboard-forbidden"
          >
            <p className="font-medium">ไม่มีสิทธิ์เข้าถึง</p>
            <p className="mt-2 text-sm">
              บัญชีของคุณต้องมี permission{" "}
              <code className="rounded bg-muted px-1">system.admin</code>{" "}
              จึงจะดูแดชบอร์ดนี้ได้
            </p>
          </div>
        ) : isError ? (
          <p className="text-destructive" data-testid="admin-dashboard-error">
            โหลดไม่สำเร็จ:{" "}
            {error instanceof Error ? error.message : String(error)}
          </p>
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
                  <table className="w-full text-sm" data-testid="admin-live-sessions-table">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">ชื่อ</th>
                        <th className="pb-2 pr-4 font-medium">สถานะ</th>
                        <th className="pb-2 pr-4 font-medium">Leader</th>
                        <th className="pb-2 font-medium">สร้างเมื่อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.liveRecentSessions.map((s) => (
                        <tr key={s.id} className="border-b border-border/60">
                          <td className="py-2 pr-4">
                            <Link
                              href={`/dashboard/live/${s.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {s.title}
                            </Link>
                          </td>
                          <td className="py-2 pr-4">
                            <span
                              className={
                                s.status === "active"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : ""
                              }
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs">
                            {s.leaderUserId.slice(0, 8)}…
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {new Date(s.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.liveRecentSessions.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    ยังไม่มีเซสชัน
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <div
              className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground"
              data-testid="admin-dashboard-footnote"
            >
              <p>
                <strong className="text-foreground">เพลงยอดนิยม</strong> มาจาก{" "}
                <code className="rounded bg-muted px-1">view_count</code> ที่เพิ่มทุกครั้งที่มีการเปิดหน้ารายละเอียดเพลง (public API)
              </p>
            </div>

            <div
              className="rounded-lg border border-dashed bg-card p-4 text-sm text-muted-foreground"
              data-testid="admin-audit-summary"
            >
              <p className="font-medium text-foreground">บันทึกตรวจสอบ (audit)</p>
              <p className="mt-2">
                ยังไม่มีหน้ารายการ audit log ในเว็บ — ข้อมูลถูกเก็บที่เซิร์ฟเวอร์ (ตาราง audit)
                หากเปิด API/UI รายการภายหลัง ให้ผูกทดสอบที่นี่
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
