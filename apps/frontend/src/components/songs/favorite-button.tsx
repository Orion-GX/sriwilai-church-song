"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import * as React from "react";

type FavoriteButtonProps = {
  songId: string;
  className?: string;
  /** ขนาดใหญ่สำหรับโหมดไลฟ์ */
  large?: boolean;
  /** แสดงข้อความแบบ compact คู่กับไอคอน */
  compactLabel?: string;
};

export function FavoriteButton({
  songId,
  className,
  large,
  compactLabel,
}: FavoriteButtonProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestSongIds = useFavoritesStore((s) => s.guestSongIds);
  const serverSongIds = useFavoritesStore((s) => s.serverSongIds);
  const toggle = useFavoritesStore((s) => s.toggle);
  const [pending, setPending] = React.useState(false);

  const on = accessToken
    ? (serverSongIds?.includes(songId) ?? false)
    : guestSongIds.includes(songId);

  return (
    <Button
      type="button"
      variant={on ? "secondary" : "outline"}
      size={large ? "lg" : compactLabel ? "sm" : "icon"}
      className={cn(
        large && "h-14 gap-2 px-5 text-lg",
        compactLabel && "h-9 gap-1.5 px-3",
        className,
      )}
      aria-pressed={on}
      aria-label={on ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
      disabled={pending}
      data-testid="favorite-button"
      data-song-id={songId}
      onClick={async () => {
        setPending(true);
        try {
          await toggle(songId);
        } catch {
          /* store เรียก syncFromServer แล้ว — รู้จัก ApiError จาก client */
        } finally {
          setPending(false);
        }
      }}
    >
      <Heart
        className={cn(
          large ? "h-7 w-7" : "h-4 w-4",
          on && "fill-red-500 text-red-500",
        )}
      />
      {large ? (on ? "โปรดแล้ว" : "โปรด") : (compactLabel ?? null)}
    </Button>
  );
}
