"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TransposeBarProps = {
  value: number;
  onChange: (semitones: number) => void;
  className?: string;
  /** โหมดใหญ่ปุ่ม (สำหรับไลฟ์) */
  large?: boolean;
};

export function TransposeBar({
  value,
  onChange,
  className,
  large,
}: TransposeBarProps) {
  const dec = () => onChange(Math.max(value - 1, -12));
  const inc = () => onChange(Math.min(value + 1, 12));
  const reset = () => onChange(0);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2",
        large && "gap-3 p-4",
        className,
      )}
    >
      <span
        className={cn(
          "min-w-[4rem] text-sm text-muted-foreground",
          large && "min-w-[6rem] text-base",
        )}
      >
        คีย์{" "}
        <strong className="text-foreground">
          {value === 0 ? "ต้นฉบับ" : `${value > 0 ? "+" : ""}${value} เสียง`}
        </strong>
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size={large ? "lg" : "default"}
          className={large ? "h-14 w-14 shrink-0 text-2xl" : ""}
          aria-label="ลดคีย์หนึ่งเสียง"
          onClick={dec}
        >
          <Minus className={large ? "h-8 w-8" : "h-4 w-4"} />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size={large ? "lg" : "sm"}
          className={cn("px-3", large && "h-14 min-w-[5rem] text-lg")}
          onClick={reset}
        >
          รีเซ็ต
        </Button>
        <Button
          type="button"
          variant="outline"
          size={large ? "lg" : "default"}
          className={large ? "h-14 w-14 shrink-0 text-2xl" : ""}
          aria-label="เพิ่มคีย์หนึ่งเสียง"
          onClick={inc}
        >
          <Plus className={large ? "h-8 w-8" : "h-4 w-4"} />
        </Button>
      </div>
    </div>
  );
}
