import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/songs", label: "เพลง" },
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/login", label: "เข้าสู่ระบบ" },
];

const navLinkClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground ui-focus-ring";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/30 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-header min-h-header max-w-layout items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-primary-foreground"
          data-testid="nav-brand"
        >
          Sriwilai Song
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn(navLinkClass)}>
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
