import type { APIRequestContext, Page } from "@playwright/test";

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
