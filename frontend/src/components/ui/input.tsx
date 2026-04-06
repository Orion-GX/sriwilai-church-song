import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground transition-colors ui-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        /** สถานะผิดพลาด / validation */
        error:
          "border-destructive text-foreground focus-visible:ring-destructive",
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
