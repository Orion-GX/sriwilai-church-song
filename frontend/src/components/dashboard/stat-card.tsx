import * as React from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  type CardProps,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardTrend =
  | {
      direction: "up" | "down" | "neutral";
      /** ตัวเลขหรือเปอร์เซ็นต์ เช่น +12% */
      value?: string;
      /** คำอธิบายสั้น เช่น เทียบเดือนที่แล้ว */
      label?: string;
    }
  | React.ReactNode;

export type StatCardProps = {
  /** หัวข้อการ์ด — ใช้ `label` แทนได้ (เข้ากันกับเวอร์ชันเดิม) */
  title?: string;
  label?: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** แนวโน้ม — วัตถุสำเร็จรูปหรือ ReactNode กำหนดเอง */
  trend?: StatCardTrend;
  /** ข้อความรองใต้ตัวเลข */
  hint?: React.ReactNode;
  className?: string;
  cardVariant?: CardProps["variant"];
} & Omit<React.HTMLAttributes<HTMLDivElement>, "title">;

function isTrendObject(
  trend: StatCardTrend,
): trend is Exclude<StatCardTrend, React.ReactNode> {
  return (
    trend !== null &&
    typeof trend === "object" &&
    !React.isValidElement(trend) &&
    "direction" in trend
  );
}

function TrendBlock({ trend }: { trend: Exclude<StatCardTrend, React.ReactNode> }) {
  const { direction, value, label } = trend;
  const Icon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
        ? TrendingDown
        : Minus;

  const tone =
    direction === "up"
      ? "text-success"
      : direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  if (!value && !label) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-2 flex flex-wrap items-center gap-1.5 text-xs font-medium tabular-nums",
        tone,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {value ? <span>{value}</span> : null}
      {label ? (
        <span className="font-normal text-muted-foreground">{label}</span>
      ) : null}
    </div>
  );
}

/**
 * การ์ดตัวเลขแบบแดชบอร์ด (Celestial-inspired) — ลำดับชัด: หัวข้อ → ตัวเลข → แนวโน้ม → hint
 */
export function StatCard({
  title,
  label,
  value,
  icon,
  trend,
  hint,
  className,
  cardVariant = "default",
  ...rest
}: StatCardProps) {
  const heading = title ?? label ?? "";

  return (
    <Card
      variant={cardVariant}
      className={cn("overflow-hidden", className)}
      {...rest}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5 md:pt-6">
        <span className="text-xs font-medium leading-none text-muted-foreground">
          {heading}
        </span>
        {icon ? (
          <span className="rounded-md bg-muted/60 p-1.5 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="pb-5 pt-0 md:pb-6">
        <div className="text-stat leading-none">{value}</div>
        {trend ? (
          isTrendObject(trend) ? (
            <TrendBlock trend={trend} />
          ) : (
            <div className="mt-2">{trend}</div>
          )
        ) : null}
        {hint ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
