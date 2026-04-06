import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/songs", label: "เพลง" },
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/login", label: "เข้าสู่ระบบ" },
];

const navLinkClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground ui-focus-ring";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-navbar text-navbar-foreground shadow-sm">
      <div className="mx-auto flex h-header min-h-header max-w-layout items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
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
