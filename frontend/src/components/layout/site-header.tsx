import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/songs", label: "เพลง" },
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/login", label: "เข้าสู่ระบบ" },
];

const navLinkClass =
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
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
