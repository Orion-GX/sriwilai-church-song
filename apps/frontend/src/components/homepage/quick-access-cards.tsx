import { BarChart3, ListChecks, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickAccessItem } from "@/components/homepage/homepage-mock-data";

type QuickAccessCardsProps = {
  items: QuickAccessItem[];
};

function iconFor(label: string, highlighted?: boolean) {
  const iconClass = cn(
    "h-4 w-4",
    highlighted ? "text-[#f0f6f4]" : "text-[#70817c]",
  );
  if (label === "Plus") return <PlusCircle className={iconClass} aria-hidden />;
  if (label === "Analytics") return <BarChart3 className={iconClass} aria-hidden />;
  return <ListChecks className={iconClass} aria-hidden />;
}

export function QuickAccessCards({ items }: QuickAccessCardsProps) {
  return (
    <section className="bg-[#edf0ed] px-4 py-12 sm:px-6 lg:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[#263330]">Quick Access</h2>
          <a
            href="#"
            className="text-sm font-medium text-[#697976] transition-colors hover:text-[#2e3b38]"
          >
            View All &rarr;
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className={cn(
                "rounded-3xl border border-[#d9dfdc] bg-white p-6 shadow-[0_8px_22px_-20px_rgba(31,42,40,0.35)]",
                item.isHighlighted && "border-[#5d746f] bg-[#5b746f] text-white",
              )}
            >
              <div
                className={cn(
                  "mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d6ddd9] bg-[#f5f8f6]",
                  item.isHighlighted &&
                    "border-white/20 bg-[#4e6661]",
                )}
              >
                {iconFor(item.iconLabel, item.isHighlighted)}
              </div>
              <h3
                className={cn(
                  "text-lg font-semibold tracking-tight text-[#24312f]",
                  item.isHighlighted && "text-white",
                )}
              >
                {item.title}
              </h3>
              <p
                className={cn(
                  "mt-2 text-sm leading-6 text-[#74817d]",
                  item.isHighlighted && "text-[#d3e0dc]",
                )}
              >
                {item.description}
              </p>
              <p
                className={cn(
                  "mt-5 text-xs font-medium uppercase tracking-wide text-[#97a49f]",
                  item.isHighlighted && "text-[#ecf4f1]",
                )}
              >
                {item.helperText}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
