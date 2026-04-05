"use client";

import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { ProfileForm } from "@/components/account/profile-form";

export default function ProfilePage() {
  return (
    <>
      <SetDashboardTitle title="โปรไฟล์" />
      <div
        className="mx-auto max-w-xl space-y-6 px-4 py-6 lg:px-0"
        data-testid="page-profile"
      >
        <ProfileForm />
      </div>
    </>
  );
}
