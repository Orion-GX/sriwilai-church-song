"use client";

import type { SetlistDetail } from "@/lib/api/types";

type SetlistHeroProps = {
  setlist: SetlistDetail;
};

function formatServiceDate(value: string | null) {
  if (!value) return "Upcoming service";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function SetlistHero({ setlist }: SetlistHeroProps) {
  const subtitle = `${formatServiceDate(setlist.serviceDate)} • ${setlist.location ?? "Main Sanctuary"}`;
  return (
    <section className="space-y-2 px-4 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Current Setlist
      </p>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {setlist.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-xl bg-secondary-container px-3 py-1.5 text-xs font-semibold text-secondary">
          {setlist.durationMinutes ?? 0}MIN
        </span>
      </div>
    </section>
  );
}
