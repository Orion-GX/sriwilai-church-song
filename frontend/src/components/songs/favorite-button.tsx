"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/lib/stores/favorites-store";

type FavoriteButtonProps = {
  songId: string;
  className?: string;
  /** ขนาดใหญ่สำหรับโหมดไลฟ์ */
  large?: boolean;
};

export function FavoriteButton({ songId, className, large }: FavoriteButtonProps) {
  const toggle = useFavoritesStore((s) => s.toggle);
  const on = useFavoritesStore((s) => s.songIds.includes(songId));

  return (
    <Button
      type="button"
      variant={on ? "secondary" : "outline"}
      size={large ? "lg" : "icon"}
      className={cn(large && "h-14 gap-2 px-5 text-lg", className)}
      aria-pressed={on}
      aria-label={on ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
      onClick={() => toggle(songId)}
    >
      <Heart
        className={cn(large ? "h-7 w-7" : "h-4 w-4", on && "fill-primary text-primary")}
      />
      {large ? (on ? "โปรดแล้ว" : "โปรด") : null}
    </Button>
  );
}
