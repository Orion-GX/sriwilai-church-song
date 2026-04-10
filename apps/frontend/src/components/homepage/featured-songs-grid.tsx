import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FeaturedSong } from "@/components/homepage/homepage-mock-data";

type FeaturedSongsGridProps = {
  items: FeaturedSong[];
};

export function FeaturedSongsGrid({ items }: FeaturedSongsGridProps) {
  return (
    <section aria-labelledby="featured-songs-title">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="featured-songs-title"
          className="text-lg font-semibold tracking-tight text-[#24312f]"
        >
          Featured Songs
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous featured songs"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d7ddda] bg-white text-[#72807c]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next featured songs"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d7ddda] bg-white text-[#72807c]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-[#dbe0dd] bg-white p-3 shadow-[0_8px_22px_-22px_rgba(31,42,40,0.45)]"
          >
            <div className="relative h-24 rounded-xl bg-[#ecefef]">
              <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#5f706b]">
                {item.keyLabel}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#253431]">{item.title}</h3>
            <p className="mt-1 text-xs text-[#788581]">{item.artist}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={`${item.title}-${tag}`}
                  className="rounded-full border border-[#d5dbd8] bg-[#f8f9f8] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#7d8b87]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
