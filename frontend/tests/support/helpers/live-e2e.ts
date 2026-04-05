import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { apiLogin } from "./api-auth";
import { injectUserSession } from "./songs-e2e";
import { getApiBaseForPlaywright } from "../fixtures/test-users";

export type PublishedSongRow = { id: string; title: string };

export async function fetchPublishedSongs(
  request: APIRequestContext,
  atLeast: number,
): Promise<PublishedSongRow[]> {
  const base = getApiBaseForPlaywright();
  const res = await request.get(`${base}/app/songs?limit=30&page=1`);
  if (!res.ok()) {
    throw new Error(`fetch songs ${res.status()}: ${await res.text()}`);
  }
  const body = (await res.json()) as { items: PublishedSongRow[] };
  const items = body.items ?? [];
  if (items.length < atLeast) {
    throw new Error(
      `ต้องมีเพลงที่เผยแพร่ในฐานอย่างน้อย ${atLeast} เพลงสำหรับเทสไลฟ์`,
    );
  }
  return items.slice(0, atLeast);
}

export async function createLiveSessionViaApi(
  request: APIRequestContext,
  accessToken: string,
  title: string,
): Promise<{ id: string }> {
  const base = getApiBaseForPlaywright();
  const token = accessToken.startsWith("Bearer") ? accessToken : `Bearer ${accessToken}`;
  const res = await request.post(`${base}/app/live/sessions`, {
    headers: { Authorization: token, "Content-Type": "application/json" },
    data: { title },
  });
  if (!res.ok()) {
    throw new Error(`create live session ${res.status()}: ${await res.text()}`);
  }
  return (await res.json()) as { id: string };
}

export async function endLiveSessionViaApi(
  request: APIRequestContext,
  accessToken: string,
  sessionId: string,
): Promise<void> {
  const base = getApiBaseForPlaywright();
  const token = accessToken.startsWith("Bearer") ? accessToken : `Bearer ${accessToken}`;
  const res = await request.post(`${base}/app/live/sessions/${sessionId}/end`, {
    headers: { Authorization: token },
  });
  if (!res.ok()) {
    throw new Error(`end live session ${res.status()}: ${await res.text()}`);
  }
}

/** รอจนกว่า UI ไลฟ์จะแสดงสถานะ WebSocket เชื่อมแล้ว (ไม่พึ่ง sleep คงที่) */
export async function waitForLiveSocketConnected(
  page: Page,
  timeoutMs = 45_000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const loc = page.getByTestId("live-ws-status").first();
        if ((await loc.count()) === 0) {
          return false;
        }
        return (await loc.getAttribute("data-state")) === "connected";
      },
      { timeout: timeoutMs },
    )
    .toBe(true);
}

/** คลิกพื้นที่ห้องไลฟ์เพื่อให้ keyboard shortcut ไปที่เอกสาร (ไม่โฟกัสช่อง input) */
export async function focusLiveRoomForKeyboard(page: Page): Promise<void> {
  await page.getByTestId("live-session-title").click();
}

/** ดัชนีเพลงปัจจุบัน (0-based) จาก `data-testid="live-song-index"` */
export async function expectLiveSongIndex(
  page: Page,
  index: number,
  total: number,
  timeoutMs = 20_000,
): Promise<void> {
  const loc = page.getByTestId("live-song-index");
  await expect
    .poll(
      async () => ({
        i: await loc.getAttribute("data-index"),
        t: await loc.getAttribute("data-total"),
      }),
      { timeout: timeoutMs },
    )
    .toEqual({ i: String(index), t: String(total) });
}

export async function openLiveRoomAsUser(
  page: Page,
  request: APIRequestContext,
  email: string,
  password: string,
  sessionId: string,
): Promise<void> {
  await injectUserSession(page, request, email, password);
  await page.goto(`/dashboard/live/${sessionId}`);
  await expect(page.getByTestId("live-session-room")).toBeVisible({ timeout: 25_000 });
}

export { injectUserSession };
