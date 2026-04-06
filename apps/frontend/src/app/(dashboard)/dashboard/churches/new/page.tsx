"use client";

import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { ChurchCreateForm } from "@/components/churches/church-create-form";
import { SectionHeader } from "@/components/ui/section-header";

export default function NewChurchPage() {
  return (
    <>
      <SetDashboardTitle title="สร้างคริสตจักร" />
      <PageContainer
        constrained={false}
        className="max-w-xl"
        data-testid="page-church-new"
      >
        <SectionHeader
          title="สร้างคริสตจักร"
          description="slug ว่างได้ — ระบบสร้างจากชื่อให้อัตโนมัติ (a-z ตัวเล็กและ -)"
        />
        <ChurchCreateForm hideCardHeader />
      </PageContainer>
    </>
  );
}
