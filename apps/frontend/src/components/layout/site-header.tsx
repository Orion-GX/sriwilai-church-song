"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/songs", label: "เพลง" },
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/login", label: "เข้าสู่ระบบ" },
];

const navLinkClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground ui-focus-ring";

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = React.useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (headerRef.current?.contains(target)) return;
      setMobileOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-primary/30 bg-primary text-primary-foreground shadow-sm"
    >
      <div className="mx-auto flex h-header min-h-header max-w-layout items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-primary-foreground"
          data-testid="nav-brand"
        >
          Sriwilai Song
        </Link>

        <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn(navLinkClass)}>
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            aria-label={mobileOpen ? "ปิดเมนูนำทาง" : "เปิดเมนูนำทาง"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "overflow-hidden border-primary-foreground/20 transition-all duration-200 ease-out md:hidden",
          mobileOpen
            ? "max-h-80 translate-y-0 border-t opacity-100"
            : "pointer-events-none max-h-0 -translate-y-1 opacity-0",
        )}
      >
        <div className="px-4 pb-3 pt-2">
          <nav className="mx-auto flex max-w-layout flex-col gap-1" aria-label="เมนูมือถือ">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(navLinkClass, "h-10 justify-start")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
