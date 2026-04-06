"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { ApiError } from "@/lib/api/client";
import { fetchChurchById } from "@/lib/api/churches";

export default function ChurchManagePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["church", id, "manage"],
    queryFn: () => fetchChurchById(id),
    enabled: !!id,
    retry: false,
  });

  return (
    <>
      <SetDashboardTitle title="จัดการคริสตจักร" />
      <PageContainer
        constrained={false}
        className="max-w-3xl"
        data-testid="page-church-manage"
      >
        <SectionHeader
          title="จัดการคริสตจักร"
          description="ข้อมูลคริสตจักรและการตั้งค่า (ขยายสมาชิก/บทบาทจาก API ได้ภายหลัง)"
        />

        {isLoading ? (
          <p className="text-muted-foreground" data-testid="church-manage-loading">
            กำลังโหลด…
          </p>
        ) : isError ? (
          <div
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
            data-testid="church-manage-error"
          >
            {error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "เข้าถึงไม่ได้"}
          </div>
        ) : data ? (
          <div data-testid="church-manage-content">
            <Card>
              <CardHeader>
                <CardTitle data-testid="church-manage-title">{data.name}</CardTitle>
                <CardDescription className="font-mono">{data.slug}</CardDescription>
              </CardHeader>
            </Card>
            <p className="mt-4 text-body text-muted-foreground">
              หน้าจัดการขั้นพื้นฐาน — สมาชิก/บทบาทขยายจาก API ได้ภายหลัง
            </p>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
