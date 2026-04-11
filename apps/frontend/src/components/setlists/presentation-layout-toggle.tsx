"use client";

import type { SetlistPresentationLayout } from "@/lib/api/types";

type PresentationLayoutToggleProps = {
  value: SetlistPresentationLayout;
  onChange: (layout: SetlistPresentationLayout) => void;
};

export function PresentationLayoutToggle({
  value,
  onChange,
}: PresentationLayoutToggleProps) {
  return (
    <div className="inline-flex rounded-xl bg-muted p-1">
      <button
        type="button"
        onClick={() => onChange("vertical")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
          value === "vertical" ? "bg-card text-foreground" : "text-muted-foreground"
        }`}
      >
        Vertical
      </button>
      <button
        type="button"
        onClick={() => onChange("horizontal")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
          value === "horizontal" ? "bg-card text-foreground" : "text-muted-foreground"
        }`}
      >
        Horizontal
      </button>
    </div>
  );
}
