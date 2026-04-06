import * as React from "react";
import { cn } from "@/lib/utils";

export type FormErrorBannerProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

/**
 * แบนเนอร์ข้อความผิดพลาดในฟอร์ม — ใช้แทน class ยาวซ้ำในหลายหน้า
 */
export function FormErrorBanner({
  className,
  children,
  ...props
}: FormErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
