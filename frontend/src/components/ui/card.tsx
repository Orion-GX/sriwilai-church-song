import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border text-card-foreground transition-shadow",
  {
    variants: {
      variant: {
        /** การ์ดมาตรฐาน: ขอบ + เงาเบา */
        default: "border-border bg-card shadow-card",
        /** ลอยขึ้น — เงาเข้มขึ้นเล็กน้อย */
        elevated: "border-border bg-card shadow-elevated",
        /** แบน: ไม่เน้น elevation (ยังมีขอบอ่อนให้อ่านง่าย) */
        flat: "border-border/80 bg-card shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5 md:p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-card-title", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 pb-5 pt-0 md:px-6 md:pb-6", className)}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center px-5 pb-5 pt-0 md:px-6 md:pb-6",
        className,
      )}
      {...props}
    />
  );
}

export { cardVariants };
