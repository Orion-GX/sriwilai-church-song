"use client";

import * as React from "react";
import { useDashboardTitle } from "@/components/layout/dashboard-provider";

export function SetDashboardTitle({ title }: { title: string }) {
  const { setTitle } = useDashboardTitle();
  React.useEffect(() => {
    setTitle(title);
    return () => setTitle("Dashboard");
  }, [title, setTitle]);
  return null;
}
