"use client";

import { SetlistBuilderScreen } from "@/components/setlists";

export default function DashboardSetlistDetailPage({
  params,
}: {
  params: { setlistId: string };
}) {
  return <SetlistBuilderScreen setlistId={params.setlistId} />;
}
