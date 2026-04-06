import { apiFetch } from "@/lib/api/client";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMyProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/app/users/me");
}

export type UpdateProfilePayload = {
  displayName?: string;
  newPassword?: string;
  currentPassword?: string;
};

export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/app/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
