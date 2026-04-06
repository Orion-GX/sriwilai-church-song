"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { buttonClassName } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { ApiError } from "@/lib/api/client";
import { fetchMyChurches } from "@/lib/api/churches";

export default function ChurchesListPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["myChurches"],
    queryFn: fetchMyChurches,
  });

  return (
    <>
      <SetDashboardTitle title="คริสตจักรของฉัน" />
      <PageContainer
        constrained={false}
        className="max-w-3xl"
        data-testid="page-churches"
      >
        <SectionHeader
          title="คริสตจักรของฉัน"
          description="รายการที่คุณเป็นสมาชิกหรือเจ้าของ"
          action={
            <Link
              href="/dashboard/churches/new"
              className={buttonClassName("default", "default")}
              data-testid="church-link-create"
            >
              สร้างคริสตจักร
            </Link>
          }
        />

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
          <p
            className="text-center text-muted-foreground"
            data-testid="church-list-empty"
          >
            ยังไม่มีคริสตจักร — กดสร้างใหม่ด้านบน
          </p>
        ) : null}
      </PageContainer>
    </>
  );
}
