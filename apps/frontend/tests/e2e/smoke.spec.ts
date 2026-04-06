import { expect, test } from "@playwright/test";

import { clearClientAuth, gotoHome, gotoLogin } from "../support/helpers/navigation";

test.describe("สโมกพื้นฐาน", () => {
  test("หน้าแรกโหลดได้", async ({ page }) => {
    await gotoHome(page);
    await expect(page.getByTestId("page-home")).toBeVisible();
    await expect(page.getByTestId("home-marketing-title")).toContainText(
      /Sriwilai/i,
    );
  });

  test("หน้าเข้าสู่ระบบโหลดได้", async ({ page }) => {
    await gotoLogin(page);
    await expect(page.getByTestId("page-auth-shell")).toBeVisible();
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("login-input-email")).toBeVisible();
  });

  test("หน้าแดชบอร์ดเมื่อยังไม่ล็อกอิน — redirect ไป /login พร้อม next", async ({
    page,
  }) => {
    await clearClientAuth(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/dashboard");
  });
});
