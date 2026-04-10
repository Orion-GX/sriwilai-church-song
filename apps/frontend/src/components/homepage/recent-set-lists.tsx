import type { RecentSetList } from "@/components/homepage/homepage-mock-data";

type RecentSetListsProps = {
  items: RecentSetList[];
};

export function RecentSetLists({ items }: RecentSetListsProps) {
  return (
    <section aria-labelledby="recent-setlists-title">
      <h2
        id="recent-setlists-title"
        className="mb-4 text-lg font-semibold tracking-tight text-[#24312f]"
      >
        Recent Set Lists
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-[#dbe0dd] bg-white p-4 shadow-[0_8px_22px_-22px_rgba(31,42,40,0.45)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[#9ba8a4]">
              {item.date}
            </p>
            <h3 className="mt-1 text-base font-semibold text-[#253431]">{item.title}</h3>
            <p className="mt-1 text-sm text-[#72807c]">{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
