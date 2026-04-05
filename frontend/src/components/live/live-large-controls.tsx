"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LiveLargeControlsProps = {
  currentLabel: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
};

/** ปุ่มใหญ่สำหรับสลับเพลงในโหมดไลฟ์ */
export function LiveLargeControls({
  currentLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
  disabled,
}: LiveLargeControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:sticky lg:bottom-auto lg:left-auto lg:right-auto lg:z-0 lg:border-t-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="truncate text-center text-lg font-semibold sm:text-left sm:text-xl">
          {currentLabel}
        </p>
        <div className="flex justify-center gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn(
              "h-16 min-w-[4.5rem] rounded-xl text-lg",
              "sm:h-20 sm:min-w-[5.5rem] sm:text-2xl",
            )}
            disabled={disabled || !canPrev}
            aria-label="เพลงก่อนหน้า"
            onClick={onPrev}
          >
            <ChevronLeft className="h-10 w-10 sm:h-12 sm:w-12" />
          </Button>
          <Button
            type="button"
            variant="default"
            size="lg"
            className={cn(
              "h-16 min-w-[4.5rem] rounded-xl text-lg",
              "sm:h-20 sm:min-w-[5.5rem] sm:text-2xl",
            )}
            disabled={disabled || !canNext}
            aria-label="เพลงถัดไป"
            onClick={onNext}
          >
            <ChevronRight className="h-10 w-10 sm:h-12 sm:w-12" />
          </Button>
        </div>
      </div>
    </div>
  );
}
