"use client";

import * as React from "react";

import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { DashboardShell } from "@/components/layout/dashboard-shell";

type DashboardContextValue = {
  setTitle: (title: string) => void;
};

const DashboardContext = React.createContext<DashboardContextValue | null>(
  null,
);

export function useDashboardTitle() {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboardTitle must be used within DashboardProvider");
  }
  return ctx;
}

export function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [title, setTitle] = React.useState("Dashboard");

  const value = React.useMemo(() => ({ setTitle }), []);

  return (
    <DashboardContext.Provider value={value}>
      <DashboardAuthGate>
        <DashboardShell title={title}>{children}</DashboardShell>
      </DashboardAuthGate>
    </DashboardContext.Provider>
  );
}
