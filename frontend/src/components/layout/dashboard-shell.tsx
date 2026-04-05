"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppNavbar } from "@/components/layout/app-navbar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
};

export function DashboardShell({ children, title }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="fixed inset-y-0 z-40 w-56 border-r bg-card">
          <AppSidebar />
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 transform border-r bg-card shadow-lg transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <AppSidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <AppNavbar
          title={title}
          showMenu
          onMenuClick={() => setMobileOpen((o) => !o)}
        />
        <main className="flex-1 bg-muted/30 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
