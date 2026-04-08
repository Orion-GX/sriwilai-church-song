"use client";

import * as React from "react";
import {
  AppShellSidebarProvider,
  type AppShellSidebarContextValue,
} from "@/components/layout/app-shell-context";
import { TopNavbar } from "@/components/layout/top-navbar";
import { COLLAPSED_RAIL } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

export type AppShellSidebarSlot =
  | React.ReactNode
  /** แนะนำ: ส่งฟังก์ชันเพื่อให้ลิงก์ใน drawer มือถือเรียก `onNavigate` ปิดเมนู */
  | ((opts: { onNavigate?: () => void }) => React.ReactNode);

export type AppShellProps = {
  children: React.ReactNode;
  title: string;
  sidebar: AppShellSidebarSlot;
  navbarActions?: React.ReactNode;
  userMenu?: React.ReactNode;
  collapsibleSidebar?: boolean;
};

function renderSidebarSlot(
  slot: AppShellSidebarSlot,
  onNavigate?: () => void,
): React.ReactNode {
  if (typeof slot === "function") {
    return slot({ onNavigate });
  }
  return slot;
}

/**
 * โครงแอดมินแบบ Celestial: ไซด์บาร์คงที่ + แถบบน + พื้นที่เนื้อหา
 * Responsive: มือถือเป็น drawer, desktop แสดงไซด์บาร์เต็มหรือย่อเป็นไอคอน
 */
export function AppShell({
  children,
  title,
  sidebar,
  navbarActions,
  userMenu,
  collapsibleSidebar = true,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const sidebarCtx: AppShellSidebarContextValue = React.useMemo(
    () => ({
      collapsed,
      toggleCollapsed: () => setCollapsed((c) => !c),
      collapsible: collapsibleSidebar,
    }),
    [collapsed, collapsibleSidebar],
  );

  const desktopRailClass = collapsed ? COLLAPSED_RAIL : "w-sidebar";

  return (
    <AppShellSidebarProvider value={sidebarCtx}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside
          className={cn(
            "hidden shrink-0 transition-[width] duration-200 ease-out lg:block",
            desktopRailClass,
          )}
        >
          <div
            className={cn(
              "fixed inset-y-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar shadow-sidebar transition-[width] duration-200 ease-out",
              desktopRailClass,
            )}
          >
            {renderSidebarSlot(sidebar, undefined)}
          </div>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-foreground/20 dark:bg-black/50 lg:hidden"
            aria-label="ปิดเมนู"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-sidebar flex-col border-r border-sidebar-border bg-sidebar shadow-card transition-transform duration-200 ease-out lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {renderSidebarSlot(sidebar, () => setMobileOpen(false))}
        </div>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <TopNavbar
            title={title}
            showMenu
            onMenuClick={() => setMobileOpen((o) => !o)}
            actions={navbarActions}
            userMenu={userMenu}
          />
          <main className="min-h-0 flex-1 bg-background p-3 md:p-4 lg:p-5">
            {children}
          </main>
        </div>
      </div>
    </AppShellSidebarProvider>
  );
}
