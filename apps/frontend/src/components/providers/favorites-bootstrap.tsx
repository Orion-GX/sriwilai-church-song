"use client";

import * as React from "react";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useFavoritesStore } from "@/lib/stores/favorites-store";

/** โหลดรายการโปรดจาก API เมื่อมี access token และล้าง state ฝั่งเซิร์ฟเวอร์เมื่อล็อกเอาท์ */
export function FavoritesBootstrap() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const syncFromServer = useFavoritesStore((s) => s.syncFromServer);
  const resetServer = useFavoritesStore((s) => s.resetServer);

  React.useEffect(() => {
    if (accessToken) {
      void syncFromServer();
    } else {
      resetServer();
    }
  }, [accessToken, syncFromServer, resetServer]);

  return null;
}
