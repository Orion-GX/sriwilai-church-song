"use client";

import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { ChurchCreateForm } from "@/components/churches/church-create-form";

export default function NewChurchPage() {
  return (
    <>
      <SetDashboardTitle title="สร้างคริสตจักร" />
      <div
        className="mx-auto max-w-xl space-y-6 px-4 py-6 lg:px-0"
        data-testid="page-church-new"
      >
        <ChurchCreateForm />
      </div>
    </>
  );
}
