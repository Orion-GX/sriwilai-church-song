"use client";

type PublicLinkCardProps = {
  publicUrl: string | null;
  isPublic: boolean;
};

export function PublicLinkCard({ publicUrl, isPublic }: PublicLinkCardProps) {
  return (
    <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
      {isPublic && publicUrl
        ? publicUrl
        : "Public link is unavailable until visibility is enabled."}
    </div>
  );
}
