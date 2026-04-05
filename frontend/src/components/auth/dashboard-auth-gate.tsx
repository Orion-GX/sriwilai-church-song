"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * ป้องกันแดชบอร์ด: หลัง rehydrate จาก localStorage ถ้าไม่มี access token ให้ไป /login
 * (persist ชื่อ ccp-auth — สอดคล้องกับ auth-store)
 */
export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      const next = pathname && pathname.startsWith("/") ? pathname : "/dashboard";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [hydrated, accessToken, router, pathname]);

  if (!hydrated || !accessToken) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6 text-muted-foreground"
        data-testid="auth-gate-loading"
      >
        กำลังโหลด…
      </div>
    );
  }

  return <>{children}</>;
}
