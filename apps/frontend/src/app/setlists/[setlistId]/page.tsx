"use client";

import { SetlistBuilderScreen } from "@/components/setlists";

export default function GuestSetlistDetailPage({
  params,
}: {
  params: { setlistId: string };
}) {
  return <SetlistBuilderScreen setlistId={params.setlistId} />;
}
