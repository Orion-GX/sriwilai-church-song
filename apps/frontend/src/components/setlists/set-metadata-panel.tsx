"use client";

import { ChevronRight, Share2 } from "lucide-react";

import type { SetlistDetail } from "@/lib/api/types";

import { PublicAccessSection } from "./public-access-section";

type SetMetadataPanelProps = {
  setlist: SetlistDetail;
  requiresLoginForPublic: boolean;
  onTogglePublic: (next: boolean) => void;
  onGeneratePublicLink: () => void;
};

export function SetMetadataPanel({
  setlist,
  requiresLoginForPublic,
  onTogglePublic,
  onGeneratePublicLink,
}: SetMetadataPanelProps) {
  return (
    <section className="mx-4 mt-6 rounded-3xl bg-muted p-4 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground">Set Metadata</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-card p-3">
          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Time Limit</p>
          <p className="mt-1 text-2xl font-semibold">{setlist.durationMinutes ?? 0}:00</p>
        </div>
        <div className="rounded-2xl bg-card p-3">
          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Items</p>
          <p className="mt-1 text-2xl font-semibold">{setlist.totalItems} Total</p>
        </div>
      </div>
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-between rounded-2xl bg-card px-3 py-3 text-sm font-medium text-foreground"
      >
        <span className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          Share with Team
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="mt-3">
        <PublicAccessSection
          isPublic={setlist.isPublic}
          publicUrl={setlist.publicUrl}
          requiresLogin={requiresLoginForPublic}
          onTogglePublic={onTogglePublic}
          onGenerateLink={onGeneratePublicLink}
        />
      </div>
    </section>
  );
}
