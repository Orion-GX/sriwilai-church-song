import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/api/types";
import {
  deriveDefaultChurchId,
  deriveEffectivePermissions,
  type PermissionCode,
} from "@/lib/auth/permissions";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  currentChurchId: string | null;
  effectivePermissions: PermissionCode[];
  setAuth: (accessToken: string, user: AuthUser) => void;
  setCurrentChurchId: (churchId: string | null) => void;
  can: (permission: PermissionCode) => boolean;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      currentChurchId: null,
      effectivePermissions: [],
      setAuth: (accessToken, user) =>
        set((state) => {
          const currentChurchId =
            state.currentChurchId && user.churchMemberships?.some((m) => m.churchId === state.currentChurchId)
              ? state.currentChurchId
              : deriveDefaultChurchId(user);
          return {
            accessToken,
            user,
            currentChurchId,
            effectivePermissions: deriveEffectivePermissions(user, currentChurchId),
          };
        }),
      setCurrentChurchId: (churchId) =>
        set((state) => ({
          currentChurchId: churchId,
          effectivePermissions: deriveEffectivePermissions(state.user, churchId),
        })),
      can: (permission) => get().effectivePermissions.includes(permission),
      logout: () =>
        set({
          accessToken: null,
          user: null,
          currentChurchId: null,
          effectivePermissions: [],
        }),
    }),
    { name: "ccp-auth" },
  ),
);
