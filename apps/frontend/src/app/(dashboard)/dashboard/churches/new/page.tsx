"use client";

import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { ChurchCreateForm } from "@/components/churches/church-create-form";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useCan } from "@/lib/auth/use-can";

export default function NewChurchPage() {
  const canCreateChurch = useCan(PERMISSIONS.CHURCH_CREATE);
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
        {canCreateChurch ? (
          <ChurchCreateForm hideCardHeader />
        ) : (
          <FormErrorBanner data-testid="church-create-forbidden">
            บัญชีนี้ไม่มีสิทธิ์สร้างคริสตจักร
          </FormErrorBanner>
        )}
      </PageContainer>
    </>
  );
}
