import * as React from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  /** @deprecated ใช้ maxWidth แทน — ถ้า false จะไม่จำกัดความกว้าง */
  constrained?: boolean;
  /** ความกว้างสูงสุดของเนื้อหา — สอดคล้อง token ใน tailwind (max-w-content / max-w-layout) */
  maxWidth?: "content" | "layout" | "none";
};

/**
 * โครงหน้าใน AppShell: จัด max-width + ระยะแนวตั้ง (ui-section-gap)
 * Padding แนวนอนหลักมาจาก `<main>` ใน AppShell — คอมโพเนนต์นี้ไม่ซ้ำ px
 */
export function PageContainer({
  className,
  constrained = true,
  maxWidth = "content",
  children,
  ...props
}: PageContainerProps) {
  const maxWidthClass =
    !constrained || maxWidth === "none"
      ? "max-w-none"
      : maxWidth === "layout"
        ? "max-w-layout"
        : "max-w-content";

  return (
    <div
      className={cn(
        "ui-section-gap flex w-full min-w-0 flex-col",
        maxWidthClass,
        maxWidth !== "none" && "mx-auto w-full",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
