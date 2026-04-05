"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Home,
  LayoutDashboard,
  ListMusic,
  Music,
  PlusCircle,
  Radio,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import { fetchAdminDashboard } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  testId?: string;
};

const coreItems: NavItem[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: Home },
  { href: "/dashboard/profile", label: "โปรไฟล์", icon: User },
  { href: "/dashboard/churches", label: "คริสตจักร", icon: Building2 },
];

const adminItem: NavItem = {
  href: "/dashboard/admin",
  label: "แอดมิน",
  icon: LayoutDashboard,
  testId: "nav-link-admin",
};

const restItems: NavItem[] = [
  { href: "/songs", label: "เพลง", icon: Music },
  { href: "/dashboard/songs/new", label: "สร้างเพลง", icon: PlusCircle },
  { href: "/dashboard/live", label: "ไลฟ์", icon: Radio },
  { href: "/dashboard/setlists", label: "เซ็ตลิสต์", icon: ListMusic },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/dashboard/profile") {
    return pathname === "/dashboard/profile";
  }
  if (href === "/dashboard/churches") {
    return pathname.startsWith("/dashboard/churches");
  }
  if (href === "/dashboard/admin") {
    return pathname.startsWith("/dashboard/admin");
  }
  if (href === "/songs") {
    return pathname === "/songs" || pathname.startsWith("/songs/");
  }
  if (href === "/dashboard/songs/new") {
    return pathname.startsWith("/dashboard/songs");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const { isSuccess: canAccessAdmin } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: fetchAdminDashboard,
    retry: false,
  });

  const items: NavItem[] = [
    ...coreItems,
    ...(canAccessAdmin ? [adminItem] : []),
    ...restItems,
  ];

  return (
    <div className="flex h-full flex-col gap-1 border-r bg-card p-3">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-4 rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent"
      >
        Sriwilai Song
      </Link>
      <nav className="flex flex-1 flex-col gap-1" data-testid="dashboard-sidebar-nav">
        {items.map(({ href, label, icon: Icon, testId }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              data-testid={testId}
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
