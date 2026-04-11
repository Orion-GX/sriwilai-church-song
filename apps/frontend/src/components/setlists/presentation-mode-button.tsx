"use client";

import { ArrowRight, PlayCircle } from "lucide-react";

type PresentationModeButtonProps = {
  onClick: () => void;
};

export function PresentationModeButton({ onClick }: PresentationModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-4 mt-5 flex w-[calc(100%-2rem)] items-center justify-between rounded-3xl bg-primary px-5 py-4 text-primary-foreground shadow-card transition hover:brightness-105"
    >
      <span className="flex items-center gap-3 text-base font-semibold">
        <PlayCircle className="h-5 w-5" />
        Presentation Mode
      </span>
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}
