import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type SongItemProps = {
  title: string;
  meta: string;
  href: string;
};

export function SongItem({ title, meta, href }: SongItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "group flex items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors",
          "hover:bg-accent/80 hover:text-foreground",
        )}
      >
        <ChevronRight
          className="mt-0.5 size-4 shrink-0 text-foreground/70 group-hover:text-foreground"
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="text-info hover:underline group-hover:text-info">
            {title}
          </span>
          <span className="text-muted-foreground"> | </span>
          <span className="text-muted-foreground">{meta}</span>
        </span>
      </Link>
    </li>
  );
}
