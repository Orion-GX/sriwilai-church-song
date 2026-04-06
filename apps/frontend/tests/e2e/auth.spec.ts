import { expect, test } from "@playwright/test";

import {
  e2ePasswordValid,
  expectDashboardVisible,
  expectLoginShellVisible,
  fillLoginForm,
  fillRegisterForm,
  submitLogin,
  submitRegister,
  uniqueRegisterEmail,
} from "../support/helpers/auth-ui";
import { clearClientAuth, gotoLogin, gotoRegister } from "../support/helpers/navigation";

test.describe("Authentication UI", () => {
  test("ลงทะเบียนสำเร็จ — ไปแดชบอร์ด", async ({ page }, testInfo) => {
    await clearClientAuth(page);
    await gotoRegister(page);
    await expect(page.getByTestId("register-form")).toBeVisible();

    const email = uniqueRegisterEmail(testInfo.workerIndex);
    await fillRegisterForm(page, {
      displayName: "Playwright User",
      email,
      password: e2ePasswordValid,
    });
    await submitRegister(page);

    await expectDashboardVisible(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("logout-button")).toBeVisible();
  });

  test("ลงทะเบียน — validation รหัสผ่านสั้นเกินไป (HTML5)", async ({ page }) => {
    await clearClientAuth(page);
    await gotoRegister(page);

    await fillRegisterForm(page, {
      displayName: "Short Pass",
      email: `pw-val-${Date.now()}@example.test`,
      password: "short",
    });
    await submitRegister(page);

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId("register-form")).toBeVisible();
    await expect(page.getByTestId("register-error")).toHaveCount(0);

    const tooShort = await page
      .getByTestId("register-input-password")
      .evaluate((el: HTMLInputElement) => el.validity.tooShort);
    expect(tooShort).toBe(true);
  });

  test("เข้าสู่ระบบสำเร็จ", async ({ page }, testInfo) => {
    await clearClientAuth(page);
    await gotoRegister(page);

    const email = uniqueRegisterEmail(testInfo.workerIndex);
    await fillRegisterForm(page, {
      displayName: "Login Flow User",
      email,
      password: e2ePasswordValid,
    });
    await submitRegister(page);
    await expectDashboardVisible(page);

    await clearClientAuth(page);
    await gotoLogin(page);
    await expectLoginShellVisible(page);

    await fillLoginForm(page, { email, password: e2ePasswordValid });
    await submitLogin(page);

    await expectDashboardVisible(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("เข้าสู่ระบบ — รหัสผ่านไม่ถูกต้อง", async ({ page }, testInfo) => {
    await clearClientAuth(page);
    await gotoRegister(page);

    const email = uniqueRegisterEmail(testInfo.workerIndex);
    await fillRegisterForm(page, {
      displayName: "Bad Creds User",
      email,
      password: e2ePasswordValid,
    });
    await submitRegister(page);
    await expectDashboardVisible(page);

    await clearClientAuth(page);
    await gotoLogin(page);

    await fillLoginForm(page, { email, password: `${e2ePasswordValid}_wrong` });
    await submitLogin(page);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("login-error")).toBeVisible();
    await expect(page.getByTestId("page-dashboard")).toHaveCount(0);
  });

  test("ออกจากระบบสำเร็จ", async ({ page }, testInfo) => {
    await clearClientAuth(page);
    await gotoRegister(page);

    const email = uniqueRegisterEmail(testInfo.workerIndex);
    await fillRegisterForm(page, {
      displayName: "Logout User",
      email,
      password: e2ePasswordValid,
    });
    await submitRegister(page);
    await expectDashboardVisible(page);

    await page.getByTestId("logout-button").click();

    await expect(page).toHaveURL(/\/login/);
    await expectLoginShellVisible(page);

    const stored = await page.evaluate(() => localStorage.getItem("ccp-auth"));
    if (stored) {
      const parsed = JSON.parse(stored) as {
        state?: { accessToken?: string | null };
      };
      expect(parsed.state?.accessToken ?? null).toBeNull();
    }
  });

  test("เส้นทางที่ต้องล็อกอิน — redirect ไป /login พร้อม next", async ({
    page,
  }) => {
    await clearClientAuth(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/dashboard");
    await expectLoginShellVisible(page);
  });
});
