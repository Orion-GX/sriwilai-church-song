"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export type TopNavbarProps = {
  title: string;
  /** ปุ่มแฮมเบอร์เกอร์ (มือถือ) */
  showMenu?: boolean;
  onMenuClick?: () => void;
  /** กลุ่มปุ่มด้านขวา (เช่น สร้าง / กรอง) — อยู่ก่อนเมนูผู้ใช้ */
  actions?: React.ReactNode;
  /** เมนูผู้ใช้ / บัญชี — ค่าเริ่มต้น: ออกจากระบบ + สลับธีม */
  userMenu?: React.ReactNode;
  className?: string;
};

const defaultUserMenu = (
  <>
    <LogoutButton />
    <ThemeToggle />
  </>
);

/**
 * แถบบนแบบ Celestial: ชื่อหน้า + พื้นที่ actions + เมนูผู้ใช้
 */
export function TopNavbar({
  title,
  onMenuClick,
  showMenu,
  actions,
  userMenu,
  className,
}: TopNavbarProps) {
  const right = userMenu ?? defaultUserMenu;

  return (
    <header
      className={cn(
        "flex h-header min-h-header shrink-0 items-center justify-between gap-4 border-b border-border bg-navbar px-4 text-navbar-foreground lg:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {showMenu ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="เปิดเมนูด้านข้าง"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <div className="flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-2">
        {actions ? (
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">{actions}</div>
        ) : null}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">{right}</div>
      </div>
    </header>
  );
}
