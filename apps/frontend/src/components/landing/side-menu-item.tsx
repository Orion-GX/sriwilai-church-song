import Link from "next/link";
import { Video } from "lucide-react";

import { cn } from "@/lib/utils";

export type SideMenuItemProps = {
  label: string;
  href: string;
};

export function SideMenuItem({ label, href }: SideMenuItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "group flex items-start gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
          "hover:bg-accent/80",
        )}
      >
        <Video
          className="mt-0.5 size-4 shrink-0 text-foreground"
          aria-hidden
        />
        <span className="text-info hover:underline group-hover:text-info">
          {label}
        </span>
      </Link>
    </li>
  );
}
