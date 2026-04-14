import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg bg-primary-input px-3 py-2 text-sm ring-1 ring-transparent ring-offset-background placeholder:text-muted-foreground transition-all ui-focus-ring focus-visible:bg-primary-input focus-visible:ring-2 focus-visible:ring-outline-variant/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
