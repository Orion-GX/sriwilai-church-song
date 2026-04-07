import type { AuthUser } from "@/lib/api/types";

export const PERMISSIONS = {
  SYSTEM_ADMIN: "system.admin",
  CHURCH_CREATE: "church.create",
  CHURCH_UPDATE: "church.update",
  CHURCH_DELETE: "church.delete",
  CHURCH_READ: "church.read",
  CHURCH_MEMBER_MANAGE: "church.member.manage",
  CHURCH_ROLE_ASSIGN: "church.role.assign",
  SONG_READ: "song.read",
  SONG_CREATE: "song.create",
  SONG_UPDATE: "song.update",
  SONG_DELETE: "song.delete",
  LIVE_READ: "live.read",
  LIVE_MANAGE: "live.manage",
  LIVE_CONTROL: "live.control",
  SETLIST_READ: "setlist.read",
  SETLIST_MANAGE: "setlist.manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

function asPermissionCode(input: string): PermissionCode {
  return input as PermissionCode;
}

export function deriveDefaultChurchId(user: AuthUser | null): string | null {
  if (!user) return null;
  if (user.currentChurchId) return user.currentChurchId;
  if (user.churchMemberships?.length) {
    return user.churchMemberships[0].churchId;
  }
  return null;
}

export function deriveEffectivePermissions(
  user: AuthUser | null,
  currentChurchId: string | null,
): PermissionCode[] {
  if (!user) return [];
  const all = new Set<PermissionCode>();
  const systemPerms = user.systemPermissions ?? [];
  for (const p of systemPerms) all.add(asPermissionCode(p));
  if (user.systemRoles?.includes("system_admin")) {
    all.add(PERMISSIONS.SYSTEM_ADMIN);
  }

  if (currentChurchId && user.churchMemberships?.length) {
    const membership = user.churchMemberships.find((m) => m.churchId === currentChurchId);
    for (const p of membership?.permissions ?? []) {
      all.add(asPermissionCode(p));
    }
  }
  return Array.from(all);
}
