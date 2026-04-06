"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export function LogoutButton() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const logoutStore = useAuthStore((s) => s.logout);
  const [loading, setLoading] = React.useState(false);

  if (!accessToken) {
    return null;
  }

  async function onLogout() {
    setLoading(true);
    try {
      await apiFetch("/app/auth/logout", {
        method: "POST",
        retryOn401: false,
      });
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        console.warn("logout request failed", err);
      }
    } finally {
      logoutStore();
      router.push("/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={onLogout}
      data-testid="logout-button"
    >
      {loading ? "กำลังออก…" : "ออกจากระบบ"}
    </Button>
  );
}
