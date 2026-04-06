"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AppSidebar } from "@/components/layout/app-sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
};

/**
 * Shell สำหรับแดชบอร์ด — ใช้ AppShell + ไซด์บาร์ของแอป
 */
export function DashboardShell({ children, title }: DashboardShellProps) {
  return (
    <AppShell
      title={title}
      sidebar={({ onNavigate }) => (
        <AppSidebar onNavigate={onNavigate} />
      )}
    >
      {children}
    </AppShell>
  );
}
