import type { APIRequestContext, Locator, Page } from "@playwright/test";

import { apiLogin, zustandAuthLocalStorageScript } from "./api-auth";
import { e2eSongEditor } from "../fixtures/test-users";

export async function injectSongEditorSession(
  page: Page,
  request: APIRequestContext,
): Promise<void> {
  const res = await apiLogin(request, e2eSongEditor.email, e2eSongEditor.password);
  const { key, value } = zustandAuthLocalStorageScript(res.accessToken, res.user);
  await page.goto("/");
  await page.evaluate(
    ({ k, v }) => {
      localStorage.setItem(k, v);
    },
    { k: key, v: value },
  );
}

/** ปุ่มโปรดตาม songId — selector เสถียรกว่าการต่อสตริงด้วยมือ */
export function favoriteButtonForSong(page: Page, songId: string): Locator {
  return page.locator(
    `[data-testid="favorite-button"][data-song-id="${songId}"]`,
  );
}

export async function injectUserSession(
  page: Page,
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const res = await apiLogin(request, email, password);
  const { key, value } = zustandAuthLocalStorageScript(res.accessToken, res.user);
  await page.goto("/");
  await page.evaluate(
    ({ k, v }) => {
      localStorage.setItem(k, v);
    },
    { k: key, v: value },
  );
}
