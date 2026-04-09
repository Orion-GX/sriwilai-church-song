"use client";

import { SongViewer } from "@/components/songs/viewer/song-viewer";
import { Button } from "@/components/ui/button";
import { chordProToContentDocument } from "@/lib/songs/song-content";
import { cn } from "@/lib/utils";
import * as React from "react";

type ChordproPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  chordproBody: string;
  originalKey?: string;
  tempo?: number;
  timeSignature?: string;
  /** แสดงใต้หัวข้อ เช่น ชื่อเพลง */
  contextTitle?: string;
};

export function ChordproPreviewModal({
  open,
  onClose,
  chordproBody,
  originalKey,
  tempo,
  timeSignature,
  contextTitle,
}: ChordproPreviewModalProps) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chordpro-preview-modal-title"
      data-testid="song-chordpro-preview-modal"
      onClick={onClose}
    >
      <div
        className={cn(
          "flex max-h-[min(85vh,720px)] w-full max-w-3xl flex-col rounded-lg border border-border bg-card shadow-elevated",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-5 py-4">
          <h2
            id="chordpro-preview-modal-title"
            className="text-lg font-semibold text-card-foreground"
          >
            ตัวอย่างการแสดงผล ChordPro
          </h2>
          {contextTitle?.trim() ? (
            <p className="mt-1 text-sm text-muted-foreground">{contextTitle}</p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div data-testid="song-chordpro-preview">
            {chordproBody.trim() ? (
              <SongViewer
                document={chordProToContentDocument(chordproBody)}
                originalKey={originalKey}
                tempo={tempo}
                timeSignature={timeSignature}
                showToolbar
                className="max-h-none overflow-visible border-0 bg-transparent p-0"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                ยังไม่มีเนื้อ ChordPro —
                พิมพ์ในช่องแก้ไขแล้วเปิดตัวอย่างอีกครั้ง
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 border-t border-border px-5 py-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
