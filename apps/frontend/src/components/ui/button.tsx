import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all hover:shadow-card active:shadow-soft ui-focus-ring disabled:pointer-events-none disabled:opacity-50 disabled:hover:shadow-none disabled:active:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary-dim text-primary-foreground shadow-soft hover:brightness-105 active:brightness-95",
        primary:
          "bg-gradient-to-r from-primary to-primary-dim text-primary-foreground shadow-soft hover:brightness-105 active:brightness-95",
        secondary:
          "bg-secondary-container text-secondary hover:brightness-95 active:brightness-90",
        outline:
          "border border-outline-variant/40 bg-surface-lowest text-foreground hover:bg-surface-low",
        ghost: "text-foreground hover:bg-surface-low",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:brightness-95",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function buttonClassName(
  variant: ButtonProps["variant"] = "default",
  size: ButtonProps["size"] = "default",
  className?: string,
) {
  return cn(buttonVariants({ variant, size }), className);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";
