"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useFavoritesStore } from "@/lib/stores/favorites-store";

type FavoriteButtonProps = {
  songId: string;
  className?: string;
  /** ขนาดใหญ่สำหรับโหมดไลฟ์ */
  large?: boolean;
};

export function FavoriteButton({ songId, className, large }: FavoriteButtonProps) {
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
      size={large ? "lg" : "icon"}
      className={cn(large && "h-14 gap-2 px-5 text-lg", className)}
      aria-pressed={on}
      aria-label={on ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
      disabled={pending}
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
        className={cn(large ? "h-7 w-7" : "h-4 w-4", on && "fill-primary text-primary")}
      />
      {large ? (on ? "โปรดแล้ว" : "โปรด") : null}
    </Button>
  );
}
