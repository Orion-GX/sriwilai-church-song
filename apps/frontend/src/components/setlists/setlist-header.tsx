"use client";

import { MoreVertical, Search } from "lucide-react";

type SetlistHeaderProps = {
  appName?: string;
};

export function SetlistHeader({ appName = "Sanctuary" }: SetlistHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 pt-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/20" />
        <p className="text-sm font-semibold text-foreground">{appName}</p>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <button
          type="button"
          className="rounded-full p-2 transition hover:bg-muted"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 transition hover:bg-muted"
          aria-label="More"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
