"use client";

import { Copy, Globe, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicLinkCard } from "./public-link-card";

type PublicAccessSectionProps = {
  isPublic: boolean;
  publicUrl: string | null;
  onTogglePublic: (next: boolean) => void;
  onGenerateLink: () => void;
};

export function PublicAccessSection({
  isPublic,
  publicUrl,
  onTogglePublic,
  onGenerateLink,
}: PublicAccessSectionProps) {
  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(
      typeof window !== "undefined"
        ? `${window.location.origin}${publicUrl}`
        : publicUrl,
    );
  };

  return (
    <div className="space-y-3 rounded-2xl bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Public access</p>
        <button
          type="button"
          onClick={() => onTogglePublic(!isPublic)}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            isPublic
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {isPublic ? "Public" : "Private"}
        </button>
      </div>
      <PublicLinkCard publicUrl={publicUrl} isPublic={isPublic} />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 rounded-xl"
          onClick={onGenerateLink}
        >
          Generate Link
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-9 flex-1 rounded-xl"
          disabled={!publicUrl || !isPublic}
          onClick={copyLink}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
      </div>
    </div>
  );
}
