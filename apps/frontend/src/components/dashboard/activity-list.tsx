import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardProps,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ActivityListItem = {
  id: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** เวลา / วันที่ ด้านขวา */
  time?: React.ReactNode;
  href?: string;
};

export type ActivityListProps = {
  title?: string;
  description?: React.ReactNode;
  items: ActivityListItem[];
  /** เมื่อ items ว่าง */
  empty?: React.ReactNode;
  className?: string;
  cardVariant?: CardProps["variant"];
};

function RowContent({
  icon,
  title,
  description,
  time,
}: Omit<ActivityListItem, "id" | "href">) {
  return (
    <div className="flex gap-3">
      {icon ? (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-medium leading-snug text-foreground">
            {title}
          </p>
          {time ? (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {time}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * รายการกิจกรรมล่าสุดแบบแดชบอร์ด — ลำดับชัด ระยะห่างสม่ำเสมอ
 */
export function ActivityList({
  title,
  description,
  items,
  empty,
  className,
  cardVariant = "default",
}: ActivityListProps) {
  const hasHeader = Boolean(title || description);

  return (
    <Card variant={cardVariant} className={cn("overflow-hidden", className)}>
      {hasHeader ? (
        <CardHeader className="pb-3">
          {title ? (
            <CardTitle className="text-base md:text-lg">{title}</CardTitle>
          ) : null}
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent
        className={cn(hasHeader ? "pt-0" : "pt-5", "pb-5 md:pb-6")}
      >
        {items.length === 0 ? (
          empty ?? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีกิจกรรม
            </p>
          )
        ) : (
          <ul className="divide-y divide-border" role="list">
            {items.map((item) => (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block rounded-md outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card -mx-2 px-2 py-1"
                  >
                    <RowContent
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      time={item.time}
                    />
                  </Link>
                ) : (
                  <RowContent
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    time={item.time}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
