import * as React from "react";
import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardProps,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ChartCardProps = {
  title: string;
  description?: React.ReactNode;
  /** ปุ่มหรือเมนูด้านขวาหัวการ์ด */
  action?: React.ReactNode;
  /** เนื้อหากราฟ (เช่น Recharts) */
  children?: React.ReactNode;
  /** แสดงเมื่อยังไม่ส่ง children — หรือกำหนดเอง */
  placeholder?: React.ReactNode;
  /** ความสูงขั้นต่ำของพื้นที่กราฟ */
  chartClassName?: string;
  className?: string;
  cardVariant?: CardProps["variant"];
};

const defaultPlaceholder = (
  <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/80 bg-muted/30 px-4 text-center">
    <BarChart3
      className="h-10 w-10 text-muted-foreground/70"
      aria-hidden
    />
    <p className="text-sm text-muted-foreground">
      พื้นที่สำหรับกราฟ — ส่ง <code className="rounded bg-muted px-1 text-xs">children</code>{" "}
      หรือใช้ <code className="rounded bg-muted px-1 text-xs">placeholder</code>
    </p>
  </div>
);

/**
 * การ์ดหัวข้อ + พื้นที่กราฟ — โครงสร้างเดียวกับวิดเจ็ตแดชบอร์ด Celestial (ทันสมัย ไม่ใช่ Bootstrap)
 */
export function ChartCard({
  title,
  description,
  action,
  children,
  placeholder,
  chartClassName,
  className,
  cardVariant = "default",
}: ChartCardProps) {
  const body = children ?? placeholder ?? defaultPlaceholder;

  return (
    <Card variant={cardVariant} className={cn("flex flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base md:text-lg">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-sm">{description}</CardDescription>
          ) : null}
        </div>
        {action ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pb-5 pt-0 md:pb-6">
        <div
          className={cn(
            "min-h-[200px] w-full flex-1 md:min-h-[220px]",
            chartClassName,
          )}
        >
          {body}
        </div>
      </CardContent>
    </Card>
  );
}
