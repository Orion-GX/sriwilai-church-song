"use client";

import { ChevronDown, ChevronUp, PencilLine } from "lucide-react";
import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";

type TransitionNotesAccordionProps = {
  value: string | null;
  onSave: (value: string) => void;
};

export function TransitionNotesAccordion({
  value,
  onSave,
}: TransitionNotesAccordionProps) {
  const [open, setOpen] = useState(Boolean(value));
  const [draft, setDraft] = useState(value ?? "");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="border-t border-border/50 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-1 text-left text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground"
      >
        <span className="flex items-center gap-1">
          <PencilLine className="h-3.5 w-3.5" />
          Transition Notes
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-2xl bg-muted p-3">
          {isEditing ? (
            <>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                placeholder="Add transition notes..."
                className="bg-card"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(value ?? "");
                    setIsEditing(false);
                  }}
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-card"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSave(draft);
                    setIsEditing(false);
                  }}
                  className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full text-left text-sm text-muted-foreground"
            >
              {value?.trim()
                ? `"${value.trim()}"`
                : "No transition note yet. Tap to add one for worship flow cues."}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
