"use client";

type PublicLinkCardProps = {
  publicUrl: string | null;
  isPublic: boolean;
  requiresLogin: boolean;
};

export function PublicLinkCard({
  publicUrl,
  isPublic,
  requiresLogin,
}: PublicLinkCardProps) {
  return (
    <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
      {requiresLogin
        ? "Guest setlist จะเห็นเฉพาะในเครื่องนี้เท่านั้น หากต้องการแชร์เป็น public กรุณาเข้าสู่ระบบก่อน"
        : isPublic && publicUrl
        ? publicUrl
        : "Public link is unavailable until visibility is enabled."}
    </div>
  );
}
