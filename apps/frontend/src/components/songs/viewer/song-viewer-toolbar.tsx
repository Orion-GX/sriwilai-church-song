"use client";

import { Button } from "@/components/ui/button";
import { transposeChordSymbol } from "@/lib/chordpro/transpose";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

type SongViewerToolbarProps = {
  originalKey: string;
  tempo: number;
  timeSignature: string;
  transpose: number;
  onTransposeChange: (value: number) => void;
  showChords: boolean;
  onShowChordsChange: (value: boolean) => void;
  fontScale: number;
  onFontScaleChange: (value: number) => void;
  className?: string;
  large?: boolean;
};

export function SongViewerToolbar({
  originalKey,
  tempo,
  timeSignature,
  transpose,
  onTransposeChange,
  showChords,
  onShowChordsChange,
  fontScale,
  onFontScaleChange,
  className,
  large = false,
}: SongViewerToolbarProps) {
  const dec = () => onTransposeChange(Math.max(transpose - 1, -12));
  const inc = () => onTransposeChange(Math.min(transpose + 1, 12));
  const reset = () => onTransposeChange(0);
  const fontDown = () => onFontScaleChange(Math.max(fontScale - 0.05, 0.8));
  const fontUp = () => onFontScaleChange(Math.min(fontScale + 0.05, 1.35));
  const transposedKey = originalKey
    ? transposeChordSymbol(originalKey, transpose)
    : null;

  const meta: string[] = [];
  if (originalKey) meta.push(`Key ${originalKey}`);
  if (tempo) meta.push(`${tempo} BPM`);
  if (timeSignature) meta.push(timeSignature);

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border bg-muted/40 p-3",
        large && "p-4",
        className,
      )}
      data-testid="transpose-bar"
    >
      {meta.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {meta.map((m) => (
            <span
              key={m}
              className={cn(
                "text-sm font-medium text-muted-foreground",
                large && "text-base",
              )}
            >
              {m}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2">
          <span
            className={cn(
              "text-sm text-muted-foreground",
              large && "text-base",
            )}
          >
            คอร์ด
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={showChords}
            aria-label="แสดงหรือซ่อนคอร์ด"
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              showChords
                ? "border-primary bg-primary"
                : "border-input bg-muted",
            )}
            onClick={() => onShowChordsChange(!showChords)}
            data-testid="toggle-chords"
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition-transform",
                showChords
                  ? "translate-x-5 bg-primary-foreground"
                  : "translate-x-0.5 bg-background",
              )}
              aria-hidden
            />
          </button>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-sm text-muted-foreground",
              large && "text-base",
            )}
            data-testid="transpose-value-label"
          >
            Key{" "}
            <strong className="text-foreground" data-testid="transpose-value">
              {transposedKey ??
                (transpose === 0
                  ? "0"
                  : `${transpose > 0 ? "+" : ""}${transpose}`)}
            </strong>
          </span>
          <div
            className="inline-flex items-center rounded-lg border border-input shadow-sm"
            role="group"
          >
            <Button
              type="button"
              variant="ghost"
              size={large ? "lg" : "sm"}
              className={cn(
                "rounded-none rounded-l-lg border-r border-input",
                large && "h-14 w-14 text-2xl",
              )}
              aria-label="ลดคีย์หนึ่งเสียง"
              onClick={dec}
              data-testid="transpose-decrement"
            >
              <Minus className={large ? "h-8 w-8" : "h-4 w-4"} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size={large ? "lg" : "sm"}
              className={cn(
                "rounded-none border-r border-input px-3",
                large && "h-14 min-w-[5rem] text-lg",
              )}
              onClick={reset}
              data-testid="transpose-reset"
            >
              รีเซ็ต
            </Button>
            <Button
              type="button"
              variant="ghost"
              size={large ? "lg" : "sm"}
              className={cn(
                "rounded-none rounded-r-lg",
                large && "h-14 w-14 text-2xl",
              )}
              aria-label="เพิ่มคีย์หนึ่งเสียง"
              onClick={inc}
              data-testid="transpose-increment"
            >
              <Plus className={large ? "h-8 w-8" : "h-4 w-4"} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm text-muted-foreground",
              large && "text-base",
            )}
          >
            ขนาดตัวอักษร
          </span>
          <div
            className="inline-flex items-center rounded-lg border border-input shadow-sm"
            role="group"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-none rounded-l-lg border-r border-input"
              onClick={fontDown}
              data-testid="font-down"
            >
              A-
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-none rounded-r-lg"
              onClick={fontUp}
              data-testid="font-up"
            >
              A+
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
