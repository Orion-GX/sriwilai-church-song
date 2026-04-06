import * as React from "react";
import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  title: string;
  description?: React.ReactNode;
  /** ปุ่มหรือกลุ่ม action ด้านขวา (desktop) */
  action?: React.ReactNode;
  className?: string;
};

/**
 * หัวส่วนในเนื้อหา (ไม่ซ้ำกับชื่อใน top bar) — ใช้คู่กับ PageContainer / การ์ด
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h2 className="text-section-title">{title}</h2>
        {description ? (
          <div className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
