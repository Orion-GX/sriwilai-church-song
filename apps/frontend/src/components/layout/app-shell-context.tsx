"use client";

import * as React from "react";

export type AppShellSidebarContextValue = {
  /** โหมดย่อไอคอนเท่านั้น (desktop) */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** เปิดใช้ปุ่มย่อ/ขยาย */
  collapsible: boolean;
};

const AppShellSidebarContext =
  React.createContext<AppShellSidebarContextValue | null>(null);

export function AppShellSidebarProvider({
  value,
  children,
}: {
  value: AppShellSidebarContextValue;
  children: React.ReactNode;
}) {
  return (
    <AppShellSidebarContext.Provider value={value}>
      {children}
    </AppShellSidebarContext.Provider>
  );
}

export function useAppShellSidebar() {
  return React.useContext(AppShellSidebarContext);
}
