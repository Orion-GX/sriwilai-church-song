import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-lg bg-surface-highest px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground transition-all ui-focus-ring focus-visible:bg-surface-lowest focus-visible:ring-2 focus-visible:ring-outline-variant/30 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "ring-1 ring-transparent",
        error:
          "text-foreground ring-1 ring-destructive/35 focus-visible:ring-destructive/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => (
    <input
      type={type}
      className={cn(inputVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { inputVariants };
