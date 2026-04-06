import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "rounded-md border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "rounded-md border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "rounded-md border-border bg-transparent text-foreground",
        success:
          "rounded-md border-transparent bg-success text-success-foreground hover:bg-success/90",
        warning:
          "rounded-md border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
        /** ข้อผิดพลาด — เทียบ destructive ในระบบสี */
        error:
          "rounded-md border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        destructive:
          "rounded-md border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        info: "rounded-md border-transparent bg-info text-info-foreground hover:bg-info/90",
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
