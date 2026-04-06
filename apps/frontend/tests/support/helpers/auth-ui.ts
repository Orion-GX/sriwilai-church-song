import { expect, type Page } from "@playwright/test";

export const e2ePasswordValid = "Playwright_e2e_123";

export function uniqueRegisterEmail(workerIndex: number): string {
  return `pw-reg-${Date.now()}-w${workerIndex}@example.test`;
}

export async function fillRegisterForm(
  page: Page,
  payload: { displayName: string; email: string; password: string },
): Promise<void> {
  await page.getByTestId("register-input-name").fill(payload.displayName);
  await page.getByTestId("register-input-email").fill(payload.email);
  await page.getByTestId("register-input-password").fill(payload.password);
}

export async function submitRegister(page: Page): Promise<void> {
  await page.getByTestId("register-submit").click();
}

export async function fillLoginForm(
  page: Page,
  payload: { email: string; password: string },
): Promise<void> {
  await page.getByTestId("login-input-email").fill(payload.email);
  await page.getByTestId("login-input-password").fill(payload.password);
}

export async function submitLogin(page: Page): Promise<void> {
  await page.getByTestId("login-submit").click();
}

export async function expectDashboardVisible(page: Page): Promise<void> {
  await expect(page.getByTestId("page-dashboard")).toBeVisible({
    timeout: 15_000,
  });
}

export async function expectLoginShellVisible(page: Page): Promise<void> {
  await expect(page.getByTestId("page-auth-shell")).toBeVisible();
  await expect(page.getByTestId("login-form")).toBeVisible();
}
