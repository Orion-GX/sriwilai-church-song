"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { buttonClassName } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { fetchMyChurches } from "@/lib/api/churches";

export default function ChurchesListPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["myChurches"],
    queryFn: fetchMyChurches,
  });

  return (
    <>
      <SetDashboardTitle title="คริสตจักร" />
      <div
        className="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-0"
        data-testid="page-churches"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">คริสตจักรของฉัน</h2>
            <p className="text-sm text-muted-foreground">
              รายการที่คุณเป็นสมาชิกหรือเจ้าของ
            </p>
          </div>
          <Link
            href="/dashboard/churches/new"
            className={buttonClassName("default", "default")}
            data-testid="church-link-create"
          >
            สร้างคริสตจักร
          </Link>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground" data-testid="church-list-loading">
            กำลังโหลด…
          </p>
        ) : isError ? (
          <p className="text-destructive" data-testid="church-list-error">
            {error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "โหลดไม่สำเร็จ"}
          </p>
        ) : (
          <ul className="space-y-2" data-testid="church-list">
            {(data ?? []).map((church) => (
              <li key={church.id} data-testid={`church-row-${church.id}`}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                    <div>
                      <CardTitle className="text-base">{church.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {church.slug}
                      </CardDescription>
                    </div>
                    <Link
                      href={`/dashboard/churches/${church.id}/manage`}
                      className={buttonClassName("outline", "sm")}
                      data-testid={`church-manage-link-${church.id}`}
                    >
                      จัดการ
                    </Link>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !isError && (data?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground" data-testid="church-list-empty">
            ยังไม่มีคริสตจักร — กดสร้างใหม่ด้านบน
          </p>
        ) : null}
      </div>
    </>
  );
}
