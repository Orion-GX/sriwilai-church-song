"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { convertRawLyricsToChordPro } from "@/lib/songs/convert-raw-lyrics-to-chordpro";
import { cn } from "@/lib/utils";
import * as React from "react";

type ConvertLyricsModalProps = {
  open: boolean;
  onClose: () => void;
  onApplyResult: (chordProText: string) => void;
};

export function ConvertLyricsModal({
  open,
  onClose,
  onApplyResult,
}: ConvertLyricsModalProps) {
  const [rawText, setRawText] = React.useState("");
  const [result, setResult] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleConvert = () => {
    setResult(convertRawLyricsToChordPro(rawText));
  };

  const handleApply = () => {
    if (!result.trim()) return;
    onApplyResult(result);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="convert-lyrics-modal-title"
      data-testid="song-convert-lyrics-modal"
      onClick={onClose}
    >
      <div
        className={cn(
          "flex max-h-[min(90vh,860px)] w-full max-w-4xl flex-col rounded-lg border border-border bg-card shadow-elevated",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-5 py-4">
          <h2
            id="convert-lyrics-modal-title"
            className="text-lg font-semibold text-card-foreground"
          >
            Convert Lyrics to ChordPro
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            วางเนื้อเพลงพร้อมคอร์ด แล้วแปลงเป็น ChordPro อัตโนมัติ
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-5 py-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="raw-lyrics-input">Raw Lyrics Input</Label>
            <Textarea
              id="raw-lyrics-input"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={18}
              className="h-full min-h-[20rem] font-mono text-sm"
              placeholder="Paste เนื้อเพลงพร้อมคอร์ดที่นี่..."
              data-testid="song-convert-raw-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chordpro-result">ChordPro Result</Label>
            <Textarea
              id="chordpro-result"
              value={result}
              readOnly
              rows={18}
              className="h-full min-h-[20rem] font-mono text-sm"
              placeholder="ผลลัพธ์หลังแปลงจะแสดงตรงนี้"
              data-testid="song-convert-result"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              onClick={handleConvert}
              disabled={!rawText.trim()}
              data-testid="song-convert-action"
            >
              Convert
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                disabled={!result.trim()}
                data-testid="song-apply-convert-result"
              >
                Apply Result
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
