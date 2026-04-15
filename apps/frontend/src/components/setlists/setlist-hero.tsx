"use client";

import * as React from "react";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SetlistDetail } from "@/lib/api/types";

type SetlistHeroProps = {
  setlist: SetlistDetail;
  onSaveTitle: (title: string) => Promise<void>;
  isSavingTitle?: boolean;
};

function formatServiceDate(value: string | null) {
  if (!value) return "Upcoming service";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function SetlistHero({
  setlist,
  onSaveTitle,
  isSavingTitle = false,
}: SetlistHeroProps) {
  const subtitle = `${formatServiceDate(setlist.serviceDate)} • ${setlist.location ?? "Main Sanctuary"}`;
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(setlist.title);

  React.useEffect(() => {
    if (!isEditingTitle) {
      setDraftTitle(setlist.title);
    }
  }, [isEditingTitle, setlist.title]);

  async function handleSaveTitle() {
    const nextTitle = draftTitle.trim();
    if (!nextTitle || nextTitle === setlist.title) {
      setIsEditingTitle(false);
      setDraftTitle(setlist.title);
      return;
    }
    await onSaveTitle(nextTitle);
    setIsEditingTitle(false);
  }

  return (
    <section className="space-y-2 px-4 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Current Setlist
      </p>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSaveTitle();
                  }
                  if (e.key === "Escape") {
                    setIsEditingTitle(false);
                    setDraftTitle(setlist.title);
                  }
                }}
                className="h-10 text-base sm:text-lg"
                placeholder="Setlist title"
                autoFocus
                disabled={isSavingTitle}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void handleSaveTitle()}
                disabled={isSavingTitle}
                aria-label="บันทึกชื่อเซ็ตลิสต์"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsEditingTitle(false);
                  setDraftTitle(setlist.title);
                }}
                disabled={isSavingTitle}
                aria-label="ยกเลิกการแก้ไขชื่อเซ็ตลิสต์"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1 className="truncate text-3xl font-bold tracking-tight text-foreground">
              {setlist.title}
            </h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {!isEditingTitle ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={() => setIsEditingTitle(true)}
            aria-label="แก้ไขชื่อเซ็ตลิสต์"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </section>
  );
}
