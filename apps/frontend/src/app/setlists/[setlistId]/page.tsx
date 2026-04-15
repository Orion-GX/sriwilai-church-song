"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { SetlistBuilderScreen } from "@/components/setlists";

export default function GuestSetlistDetailPage({
  params,
}: {
  params: { setlistId: string };
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <SetlistBuilderScreen setlistId={params.setlistId} />
      </main>
    </div>
  );
}
