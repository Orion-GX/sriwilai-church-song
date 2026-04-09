import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/homepage/container";
import { cn } from "@/lib/utils";

const navLinkClass =
  "inline-flex items-center gap-0.5 text-sm font-medium text-primary-foreground/90 transition-colors hover:text-primary-foreground";

type NavItemProps = {
  href: string;
  label: string;
  hasDropdown?: boolean;
};

function NavItem({ href, label, hasDropdown }: NavItemProps) {
  return (
    <Link href={href} className={navLinkClass}>
      <span>{label}</span>
      {hasDropdown ? (
        <ChevronDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
      ) : null}
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="min-h-header border-b border-primary/30 bg-primary text-primary-foreground shadow-soft">
      <Container className="flex h-header items-center justify-between gap-6 py-0">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-primary-foreground"
          data-testid="home-marketing-title"
        >
          Sriwilai Church
        </Link>

        <nav
          className="flex max-w-[min(100%,42rem)] flex-1 items-center justify-start gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center sm:gap-6 md:max-w-none [&::-webkit-scrollbar]:hidden"
          aria-label="หลัก"
        >
          {/* <NavItem href="#" label="Bible" hasDropdown /> */}
          <NavItem href="/songs" label="เพลงนมัสการ" />
          <NavItem href="#" label="ชีทเพลง" />
          <NavItem href="#" label="Live" hasDropdown />
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <Link href="/login" className={cn(navLinkClass, "text-sm")}>
            <span>เข้าสู่ระบบ</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
          </Link>
        </div>
      </Container>
    </header>
  );
}
