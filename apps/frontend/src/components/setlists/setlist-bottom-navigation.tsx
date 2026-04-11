"use client";

import Link from "next/link";
import { CalendarDays, Music2, UsersRound } from "lucide-react";
import { ListMusic } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { key: "songs", label: "Songs", href: "/songs", icon: Music2 },
  { key: "setlists", label: "Setlists", href: "/dashboard/setlists", icon: ListMusic },
  { key: "team", label: "Team", href: "/dashboard/churches", icon: UsersRound },
  { key: "schedule", label: "Schedule", href: "/dashboard", icon: CalendarDays },
] as const;

type SetlistBottomNavigationProps = {
  active?: (typeof items)[number]["key"];
};

export function SetlistBottomNavigation({
  active = "setlists",
}: SetlistBottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-card/95 px-2 py-2 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition",
                  isActive ? "bg-muted text-foreground" : "hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
