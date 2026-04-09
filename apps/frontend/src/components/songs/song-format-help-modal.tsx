"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SongFormatHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

const chordProExample = `{title: ทุกวันเวลา}
[Gmaj7]ทุกวันเวลา [Cmaj7]ข้าอยากอยู่ใกล้ชิดพระองค์
[Gmaj7]All of My Days [Cmaj7]I Want To Be Close To You

[Gmaj7]ทุกวันเวลา [Cmaj7]อยู่ในความรักของพระองค์
[Gmaj7]All of My Days [Cmaj7]I Want To Be In Your Love`;

const chordProNoEnglishExample = `{title: ทุกวันเวลา}
[Gmaj7]ทุกวันเวลา [Cmaj7]ข้าอยากอยู่ใกล้ชิดพระองค์

[Gmaj7]ทุกวันเวลา [Cmaj7]อยู่ในความรักของพระองค์`;

export function SongFormatHelpModal({ open, onClose }: SongFormatHelpModalProps) {
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="song-format-help-title"
      data-testid="song-format-help-modal"
      onClick={onClose}
    >
      <div
        className={cn(
          "flex max-h-[min(88vh,820px)] w-full max-w-3xl flex-col rounded-lg border border-border bg-card shadow-elevated",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-5 py-4">
          <h2 id="song-format-help-title" className="text-lg font-semibold text-card-foreground">
            คำแนะนำการใส่ ChordPro
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ถ้าต้องการให้ preview แสดงคอร์ดตรงตำแหน่ง ให้ใส่คอร์ดในวงเล็บเหลี่ยมก่อนคำร้องที่ต้องการผูก
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>คอร์ดต้องอยู่ในรูปแบบเช่น `[G]`, `[F#m7]`, `[A/C#]`</li>
            <li>หนึ่งบรรทัดสามารถมีหลายคอร์ดได้ โดยใส่คอร์ดก่อนข้อความแต่ละช่วง</li>
            <li>ถ้ามีไทยและอังกฤษ ให้แยกเป็นคนละบรรทัด (ลำดับเดียวกันต่อท่อน)</li>
            <li>เว้นบรรทัดว่างเพื่อแบ่งท่อน ช่วยให้อ่านง่ายในหน้าแสดงผล</li>
          </ul>

          <div className="space-y-2">
            <p className="font-medium text-foreground">
              ตัวอย่างแปลงจากข้อความที่ให้มาเป็น ChordPro
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
              {chordProExample}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">กรณีไม่มีภาษาอังกฤษ</p>
            <p className="text-muted-foreground">
              ใส่เฉพาะบรรทัดไทยได้เลย (ไม่จำเป็นต้องมีบรรทัดอังกฤษ)
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
              {chordProNoEnglishExample}
            </pre>
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
