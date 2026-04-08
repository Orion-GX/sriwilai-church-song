"use client";

import { useAppShellSidebar } from "@/components/layout/app-shell-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Music } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  testId?: string;
};

type SidebarProps = {
  /** หัวแบรนด์ */
  brand: { title: string; href: string };
  items: SidebarNavItem[];
  /** กำหนดว่าเมนูใด active (รองรับเส้นทางพิเศษของแอป) */
  isActive: (pathname: string, href: string) => boolean;
  /** เรียกเมื่อคลิกลิงก์ (เช่น ปิด drawer มือถือ) */
  onNavigate?: () => void;
  beforeNav?: React.ReactNode;
  className?: string;
};

const COLLAPSED_RAIL = "w-[4.375rem]"; /* ~70px — ใกล้ Celestial icon-only */

/**
 * ไซด์บาร์แนวตั้งแบบ Celestial: ไอคอน + ป้าย, สถานะ active, รองรับย่อผ่าน context
 */
export function Sidebar({
  brand,
  items,
  isActive,
  onNavigate,
  beforeNav,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const shell = useAppShellSidebar();
  const collapsed = Boolean(shell?.collapsible && shell.collapsed);
  const showCollapse = Boolean(shell?.collapsible);

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-1 bg-sidebar p-3 text-sidebar-foreground",
        collapsed && "items-stretch px-2",
        className,
      )}
      style={{ backgroundColor: "hsl(var(--primary))" }}
    >
      <Link
        href={brand.href}
        onClick={onNavigate}
        className={cn(
          "mb-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-tight text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
          collapsed && "justify-center px-0",
        )}
        title={collapsed ? brand.title : undefined}
      >
        {collapsed ? (
          <Music className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        ) : null}
        <span className={cn(collapsed && "sr-only")}>{brand.title}</span>
      </Link>

      {beforeNav}

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto"
        data-testid="dashboard-sidebar-nav"
      >
        {items.map(({ href, label, icon: Icon, testId }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              data-testid={testId}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className={cn(collapsed && "sr-only")}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {showCollapse && shell ? (
        <div className="hidden shrink-0 border-t border-sidebar-border pt-2 lg:block">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-full"
            aria-label={shell.collapsed ? "ขยายเมนู" : "ย่อเมนู"}
            onClick={() => shell.toggleCollapsed()}
          >
            {shell.collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { COLLAPSED_RAIL };
