import { Instagram, Music2 } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  "Privacy Policy",
  "Terms of Service",
  "Support",
  "Contact",
];

export function HomepageFooter() {
  return (
    <footer className="mt-14 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:pb-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 border-t border-[#d9dfdc] pt-8">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {footerLinks.map((label) => (
            <Link
              key={label}
              href="#"
              className="text-xs text-[#8a9693] transition-colors hover:text-[#5d6e6a]"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-[#9aa6a3]">&copy; 2026 S MINISTRY</p>
        <div className="flex items-center gap-3 text-[#9aa6a3]">
          <Link
            href="#"
            aria-label="Music platform"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d9dfdc]"
          >
            <Music2 className="h-4 w-4" />
          </Link>
          <Link
            href="#"
            aria-label="Instagram"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d9dfdc]"
          >
            <Instagram className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
