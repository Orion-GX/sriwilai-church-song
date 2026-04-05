import type { APIRequestContext } from "@playwright/test";

import { getApiBaseForPlaywright } from "../fixtures/test-users";

export type LoginJsonResponse = {
  accessToken: string;
  user: { id: string; email: string; displayName: string };
};

/**
 * ล็อกอินผ่าน REST (เร็ว ไม่ต้องกรอกฟอร์ม) — ใช้ request context ของ Playwright
 */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<LoginJsonResponse> {
  const base = getApiBaseForPlaywright();
  const res = await request.post(`${base}/app/auth/login`, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`apiLogin failed ${res.status()}: ${text}`);
  }
  return (await res.json()) as LoginJsonResponse;
}

/** เขียน state ของ zustand persist (ชื่อ `ccp-auth`) ลง localStorage ก่อนเปิดหน้าแอป */
export function zustandAuthLocalStorageScript(
  accessToken: string,
  user: LoginJsonResponse["user"],
): { key: string; value: string } {
  return {
    key: "ccp-auth",
    value: JSON.stringify({
      state: {
        accessToken,
        user,
      },
      version: 0,
    }),
  };
}
