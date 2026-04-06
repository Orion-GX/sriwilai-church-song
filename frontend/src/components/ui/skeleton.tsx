import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    variant: {
      /** บล็อกทั่วไป — มุมตาม design token */
      default: "rounded-md",
      /** อวตาร / ไอคอนโหลด */
      circular: "rounded-full",
      /** บรรทัดข้อความ */
      text: "rounded-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof skeletonVariants>;

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  ),
);
Skeleton.displayName = "Skeleton";

export { skeletonVariants };
