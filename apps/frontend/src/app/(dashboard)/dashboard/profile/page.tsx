"use client";

import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { ProfileForm } from "@/components/account/profile-form";
import { SectionHeader } from "@/components/ui/section-header";

export default function ProfilePage() {
  return (
    <>
      <SetDashboardTitle title="โปรไฟล์" />
      <PageContainer
        constrained={false}
        className="max-w-xl"
        data-testid="page-profile"
      >
        <SectionHeader
          title="โปรไฟล์"
          description="แก้ไขชื่อที่แสดง (อีเมลเปลี่ยนผ่านแอดมินเท่านั้น)"
        />
        <ProfileForm hideCardHeader />
      </PageContainer>
    </>
  );
}
