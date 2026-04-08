"use client";

import type { PermissionCode } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useMemo } from "react";

export function useCan(permission: PermissionCode): boolean {
  const effectivePermissions = useAuthStore((s) => s.effectivePermissions);
  return useMemo(
    () => effectivePermissions.includes(permission),
    [effectivePermissions, permission],
  );
}
