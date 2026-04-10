import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary-dim text-primary-foreground",
        secondary:
          "bg-secondary-container text-secondary",
        outline: "bg-surface-low text-foreground",
        success:
          "bg-success text-success-foreground",
        warning:
          "bg-warning text-warning-foreground",
        error:
          "bg-destructive text-destructive-foreground",
        destructive:
          "bg-destructive text-destructive-foreground",
        info: "bg-info text-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
