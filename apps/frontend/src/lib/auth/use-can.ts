"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { PermissionCode } from "@/lib/auth/permissions";

export function useCan(permission: PermissionCode): boolean {
  const effectivePermissions = useAuthStore((s) => s.effectivePermissions);
  return useMemo(
    () => effectivePermissions.includes(permission),
    [effectivePermissions, permission],
  );
}
