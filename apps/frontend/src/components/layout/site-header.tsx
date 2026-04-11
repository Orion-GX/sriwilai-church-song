"use client";

import { cn } from "@/lib/utils";
import { BookOpen, ListMusic } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

const nav = [
  { href: "/songs", label: "เพลง" },
  { href: "/dashboard/setlists", label: "เซ็ตลิสต์เพลง" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = React.useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 bg-[#f6f7f5]/95 backdrop-blur transition-shadow",
          isScrolled
            ? "shadow-[0_8px_22px_-18px_rgba(31,42,40,0.5)]"
            : "shadow-none",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-[#1f2a28]"
            data-testid="nav-brand"
          >
            Worship Chord
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative pb-1 text-sm font-medium text-[#475653] transition-colors hover:text-[#1f2a28]",
                  isActive(item.href) && "text-[#1f2a28]",
                )}
              >
                {item.label}
                {isActive(item.href) ? (
                  <span className="absolute -bottom-0.5 left-0 h-px w-full bg-[#70817c]" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full bg-[#4f6863] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#435a56]"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dce1de] bg-[#f6f7f5]/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur md:hidden">
        <ul className="grid grid-cols-2 gap-2">
          <li>
            <Link
              href="/songs"
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-[#556460] transition-colors",
                isActive("/songs") && "bg-[#e8edeb] text-[#1f2a28]",
              )}
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              <span>เพลง</span>
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/setlists"
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-[#556460] transition-colors",
                isActive("/dashboard/setlists") &&
                  "bg-[#e8edeb] text-[#1f2a28]",
              )}
            >
              <ListMusic className="h-4 w-4" aria-hidden />
              <span>เซ็ตลิสต์</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
