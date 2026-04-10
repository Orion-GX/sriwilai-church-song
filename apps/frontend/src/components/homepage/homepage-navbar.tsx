"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/homepage/homepage-mock-data";

type HomepageNavbarProps = {
  brand: string;
  navItems: NavItem[];
};

export function HomepageNavbar({ brand, navItems }: HomepageNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4e7e3] bg-[#f6f7f5]/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold tracking-tight text-[#1f2a28]">
          {brand}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "relative pb-1 text-sm font-medium text-[#475653] transition-colors hover:text-[#1f2a28]",
                item.active && "text-[#1f2a28]",
              )}
            >
              {item.label}
              {item.active ? (
                <span className="absolute -bottom-0.5 left-0 h-px w-full bg-[#70817c]" />
              ) : null}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm font-medium text-[#5a6865] transition-colors hover:text-[#1f2a28]"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#4f6863] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#435a56]"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9dfdc] text-[#34423f] md:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[#e4e7e3] bg-[#f6f7f5] px-4 pb-4 pt-3 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium text-[#4b5a57]",
                  item.active && "bg-[#e8edeb] text-[#1f2a28]",
                )}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-[#d8dfdc] px-3 py-2 text-sm font-medium text-[#455552]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#4f6863] px-3 py-2 text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
