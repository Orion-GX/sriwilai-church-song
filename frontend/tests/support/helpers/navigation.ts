import type { Page } from "@playwright/test";

export async function gotoHome(page: Page): Promise<void> {
  await page.goto("/");
}

export async function gotoLogin(page: Page): Promise<void> {
  await page.goto("/login");
}

export async function gotoRegister(page: Page): Promise<void> {
  await page.goto("/register");
}

export async function clearClientAuth(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.removeItem("ccp-auth");
    } catch {
      /* ignore */
    }
  });
}
