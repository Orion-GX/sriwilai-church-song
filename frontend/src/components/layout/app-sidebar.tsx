"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  ListMusic,
  Music,
  PlusCircle,
  Radio,
  Settings,
  User,
} from "lucide-react";
import { fetchAdminDashboard } from "@/lib/api/admin";
import { Sidebar, type SidebarNavItem } from "@/components/layout/sidebar";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/dashboard/ui-showcase") {
    return pathname === "/dashboard/ui-showcase";
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

const coreItems: SidebarNavItem[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: Home },
  { href: "/dashboard/profile", label: "โปรไฟล์", icon: User },
  { href: "/dashboard/churches", label: "คริสตจักร", icon: Building2 },
];

const adminItem: SidebarNavItem = {
  href: "/dashboard/admin",
  label: "แอดมิน",
  icon: LayoutDashboard,
  testId: "nav-link-admin",
};

const restItems: SidebarNavItem[] = [
  { href: "/dashboard/ui-showcase", label: "UI อ้างอิง", icon: LayoutTemplate },
  { href: "/songs", label: "เพลง", icon: Music },
  { href: "/dashboard/songs/new", label: "สร้างเพลง", icon: PlusCircle },
  { href: "/dashboard/live", label: "ไลฟ์", icon: Radio },
  { href: "/dashboard/setlists", label: "เซ็ตลิสต์", icon: ListMusic },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const { isSuccess: canAccessAdmin } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: fetchAdminDashboard,
    retry: false,
  });

  const items: SidebarNavItem[] = [
    ...coreItems,
    ...(canAccessAdmin ? [adminItem] : []),
    ...restItems,
  ];

  return (
    <Sidebar
      brand={{ title: "Sriwilai Song", href: "/" }}
      items={items}
      isActive={isActive}
      onNavigate={onNavigate}
    />
  );
}
