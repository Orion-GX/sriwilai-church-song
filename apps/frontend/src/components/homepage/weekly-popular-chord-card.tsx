import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WeeklyPopularChordItem = {
  id: string;
  /** แสดงป้ายสีเมื่อเป็น 1–3 ตามดีไซน์; ไม่ส่ง = ไม่แสดงป้ายอันดับ */
  rank?: 1 | 2 | 3;
  title: string;
  artist: string;
  coverSrc: string;
  href: string;
};

const rankBadgeClass: Record<NonNullable<WeeklyPopularChordItem["rank"]>, string> = {
  1: "bg-blue-600 text-white shadow-md shadow-blue-900/40",
  2: "bg-emerald-600 text-white shadow-md shadow-emerald-900/40",
  3: "bg-orange-500 text-white shadow-md shadow-orange-900/40",
};

type WeeklyPopularChordCardProps = {
  item: WeeklyPopularChordItem;
};

export function WeeklyPopularChordCard({ item }: WeeklyPopularChordCardProps) {
  const { rank, title, artist, coverSrc, href } = item;

  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/10 bg-[#1c1c1c] p-4",
        "transition-colors duration-200 hover:border-white/20 hover:bg-[#222222]",
      )}
    >
      <div className="relative shrink-0">
        <Image
          src={coverSrc}
          alt={`ปกเพลง ${title}`}
          width={64}
          height={64}
          className="size-14 rounded-md object-cover sm:size-16"
          sizes="64px"
          unoptimized
        />
        {rank != null ? (
          <span
            className={cn(
              "absolute -left-1 -top-1 flex size-7 items-center justify-center rounded-full text-[10px] font-bold tabular-nums leading-none ring-2 ring-[#1c1c1c]",
              rankBadgeClass[rank],
            )}
            aria-label={`อันดับ ${rank}`}
          >
            {String(rank).padStart(2, "0")}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate font-semibold text-white">{title}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-400 sm:text-sm">{artist}</p>
      </div>

      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "sm" }),
          "shrink-0 rounded-full border-0 bg-blue-600 px-4 text-xs font-medium text-white shadow-sm",
          "hover:bg-blue-500 hover:text-white focus-visible:ring-blue-400",
        )}
      >
        ดูคอร์ด
      </Link>
    </article>
  );
}
