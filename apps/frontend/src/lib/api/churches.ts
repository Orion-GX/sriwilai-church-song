import { apiFetch } from "@/lib/api/client";

export type ChurchDto = {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMyChurches(): Promise<ChurchDto[]> {
  return apiFetch<ChurchDto[]>("/app/churches");
}

export type CreateChurchPayload = {
  name: string;
  slug?: string;
};

export async function createChurch(payload: CreateChurchPayload): Promise<ChurchDto> {
  return apiFetch<ChurchDto>("/app/churches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchChurchById(id: string): Promise<ChurchDto> {
  return apiFetch<ChurchDto>(`/app/churches/${id}`);
}
