import { apiFetch } from "@/lib/api/client";
import type {
  LiveSessionRow,
  LiveSessionStatePayload,
} from "@/lib/api/types";

export async function fetchLiveSessions(
  churchId?: string,
): Promise<LiveSessionRow[]> {
  const q = churchId ? `?churchId=${encodeURIComponent(churchId)}` : "";
  return apiFetch<LiveSessionRow[]>(`/app/live/sessions${q}`);
}

export async function fetchAdminLiveSessions(
  churchId?: string,
): Promise<LiveSessionRow[]> {
  const q = churchId ? `?churchId=${encodeURIComponent(churchId)}` : "";
  return apiFetch<LiveSessionRow[]>(`/app/admin/live/sessions${q}`);
}

export async function createLiveSession(body: {
  title: string;
}): Promise<LiveSessionRow> {
  return apiFetch<LiveSessionRow>(`/app/live/sessions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createAdminLiveSession(body: {
  title: string;
}): Promise<LiveSessionRow> {
  return apiFetch<LiveSessionRow>(`/app/admin/live/sessions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchLiveSessionState(
  sessionId: string,
): Promise<LiveSessionStatePayload> {
  return apiFetch<LiveSessionStatePayload>(
    `/app/live/sessions/${sessionId}`,
  );
}

export async function fetchAdminLiveSessionState(
  sessionId: string,
): Promise<LiveSessionStatePayload> {
  return apiFetch<LiveSessionStatePayload>(
    `/app/admin/live/sessions/${sessionId}`,
  );
}

export async function endLiveSession(sessionId: string): Promise<void> {
  await apiFetch<undefined>(`/app/live/sessions/${sessionId}/end`, {
    method: "POST",
  });
}

export async function endAdminLiveSession(sessionId: string): Promise<void> {
  await apiFetch<undefined>(`/app/admin/live/sessions/${sessionId}/end`, {
    method: "POST",
  });
}
