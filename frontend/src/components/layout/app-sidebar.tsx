"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  ListMusic,
  Music,
  PlusCircle,
  Radio,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: Home },
  { href: "/dashboard/admin", label: "แอดมิน", icon: LayoutDashboard },
  { href: "/songs", label: "เพลง", icon: Music },
  { href: "/dashboard/songs/new", label: "สร้างเพลง", icon: PlusCircle },
  { href: "/dashboard/live", label: "ไลฟ์", icon: Radio },
  { href: "/dashboard/setlists", label: "เซ็ตลิสต์", icon: ListMusic },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-1 border-r bg-card p-3">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-4 rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent"
      >
        Sriwilai Song
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : href === "/songs"
                ? pathname === "/songs" || pathname.startsWith("/songs/")
              : href === "/dashboard/songs/new"
                ? pathname.startsWith("/dashboard/songs")
              : href === "/dashboard/admin"
                ? pathname.startsWith("/dashboard/admin")
                : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
