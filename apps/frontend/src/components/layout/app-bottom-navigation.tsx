"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { BottomNavigationItem } from "./site-header";

type AppBottomNavigationProps = {
  active?: BottomNavigationItem["key"];
  items?: BottomNavigationItem[];
};

export function AppBottomNavigation({
  active,
  items = [],
}: AppBottomNavigationProps) {
  const pathname = usePathname();
  const isActive = (item: BottomNavigationItem) =>
    active
      ? item.key === active
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-card/95 px-2 py-2 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-2 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const activeItem = isActive(item);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold text-muted-foreground transition",
                  activeItem ? "bg-muted text-foreground" : "hover:bg-muted",
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
