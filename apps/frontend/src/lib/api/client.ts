import { getApiBase } from "@/lib/api/env";
import type { AuthResponse } from "@/lib/api/types";
import { useAuthStore } from "@/lib/stores/auth-store";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function formatApiMessage(message: unknown, fallback: string): string {
  if (message == null) {
    return fallback;
  }
  if (typeof message === "string") {
    return message;
  }
  if (Array.isArray(message) && message.every((m) => typeof m === "string")) {
    return message.join("; ");
  }
  try {
    return JSON.stringify(message);
  } catch {
    return fallback;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${getApiBase()}/app/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      refreshPromise = null;
      if (!res.ok) {
        useAuthStore.getState().logout();
        return null;
      }
      const data = (await res.json()) as AuthResponse;
      useAuthStore.getState().setAuth(data.accessToken, data.user);
      return data.accessToken;
    })();
  }
  return refreshPromise;
}

type FetchOptions = RequestInit & {
  /** ไม่แนบ Bearer (เช่น login/register) */
  auth?: boolean;
  /** ถ้า 401 แล้วลอง refresh หนึ่งครั้ง */
  retryOn401?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = true, retryOn401 = true, ...init } = options;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && auth && retryOn401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const h2 = new Headers(init.headers);
      if (!h2.has("Content-Type") && init.body) {
        h2.set("Content-Type", "application/json");
      }
      h2.set("Authorization", `Bearer ${newToken}`);
      const retry = await fetch(url, {
        ...init,
        headers: h2,
        credentials: "include",
      });
      return parseJson(retry);
    }
  }

  return parseJson(res);
}

async function parseJson<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  const text = await res.text();
  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const rawMsg =
      typeof body === "object" && body !== null && "message" in body
        ? (body as { message: unknown }).message
        : undefined;
    const msg = formatApiMessage(rawMsg, res.statusText);
    throw new ApiError(msg || `HTTP ${res.status}`, res.status, body);
  }
  return body as T;
}

export async function apiPostAuth(
  path: string,
  body: Record<string, unknown>,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
    retryOn401: false,
  });
}
