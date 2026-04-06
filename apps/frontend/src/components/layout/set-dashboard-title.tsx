"use client";

import * as React from "react";
import {
  DEFAULT_DASHBOARD_TITLE,
  useDashboardTitle,
} from "@/components/layout/dashboard-provider";

export function SetDashboardTitle({ title }: { title: string }) {
  const { setTitle } = useDashboardTitle();
  React.useEffect(() => {
    setTitle(title);
    return () => setTitle(DEFAULT_DASHBOARD_TITLE);
  }, [title, setTitle]);
  return null;
}
