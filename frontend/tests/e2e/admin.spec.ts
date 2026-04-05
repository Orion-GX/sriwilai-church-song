import { expect, test } from "@playwright/test";

import { e2ePasswordValid, uniqueRegisterEmail } from "../support/helpers/auth-ui";
import { clearClientAuth, gotoLogin } from "../support/helpers/navigation";
import { injectUserSession } from "../support/helpers/songs-e2e";
import {
  e2eAdminUser,
  getApiBaseForPlaywright,
  hasAdminCredentials,
} from "../support/fixtures/test-users";

test.describe("แดชบอร์ดแอดมิน", () => {
  test("แอดมินล็อกอินผ่าน UI แล้วเข้าหน้าแอดมินได้", async ({ page }) => {
    test.skip(!hasAdminCredentials(), "ตั้ง E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD และมอบ role system_admin");

    await clearClientAuth(page);
    await gotoLogin(page);
    await page.getByTestId("login-input-email").fill(e2eAdminUser.email);
    await page.getByTestId("login-input-password").fill(e2eAdminUser.password);
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.goto("/dashboard/admin");

    await expect(page.getByTestId("page-admin-dashboard")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-dashboard-loading")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("admin-dashboard-forbidden")).toHaveCount(0);
    await expect(page.getByTestId("admin-dashboard-content")).toBeVisible();
  });

  test("ผู้ใช้ทั่วไปไม่เข้าถึงข้อมูลแอดมิน (403)", async ({ page, request }, testInfo) => {
    const email = uniqueRegisterEmail(testInfo.workerIndex + 700);
    const reg = await request.post(`${getApiBaseForPlaywright()}/app/auth/register`, {
      data: {
        displayName: "Non-Admin E2E",
        email,
        password: e2ePasswordValid,
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(reg.ok(), await reg.text()).toBeTruthy();

    await clearClientAuth(page);
    await injectUserSession(page, request, email, e2ePasswordValid);

    await page.goto("/dashboard/admin");
    await expect(page.getByTestId("page-admin-dashboard")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-dashboard-loading")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("admin-dashboard-forbidden")).toBeVisible();
    await expect(page.getByTestId("admin-dashboard-content")).toHaveCount(0);
  });

  test("วิดเจ็ตสถิติและกราฟโหลดสำเร็จ (แอดมิน)", async ({ page, request }) => {
    test.skip(!hasAdminCredentials(), "ตั้ง E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

    await clearClientAuth(page);
    await injectUserSession(page, request, e2eAdminUser.email, e2eAdminUser.password);

    await page.goto("/dashboard/admin");
    await expect(page.getByTestId("admin-dashboard-loading")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("admin-dashboard-content")).toBeVisible();

    await expect(page.getByTestId("admin-stats-grid")).toBeVisible();
    await expect(page.getByTestId("admin-stat-songs-total")).toBeVisible();
    await expect(page.getByTestId("admin-stat-users-total")).toBeVisible();
    await expect(page.getByTestId("admin-charts-grid")).toBeVisible();
    await expect(page.getByTestId("admin-chart-songs-by-day")).toBeVisible();
    await expect(page.getByTestId("admin-live-sessions-card")).toBeVisible();
    await expect(page.getByTestId("admin-live-sessions-table")).toBeVisible();
  });

  test("แถบข้าง: แอดมินเห็นลิงก์แอดมิน — ผู้ใช้ทั่วไปไม่เห็น", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(!hasAdminCredentials(), "ตั้ง E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

    await clearClientAuth(page);
    await injectUserSession(page, request, e2eAdminUser.email, e2eAdminUser.password);
    await page.goto("/dashboard");
    await expect(page.getByTestId("page-dashboard")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("nav-link-admin")).toBeVisible({ timeout: 25_000 });

    const email = uniqueRegisterEmail(testInfo.workerIndex + 800);
    const reg = await request.post(`${getApiBaseForPlaywright()}/app/auth/register`, {
      data: {
        displayName: "Sidebar User",
        email,
        password: e2ePasswordValid,
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(reg.ok(), await reg.text()).toBeTruthy();

    await clearClientAuth(page);
    await injectUserSession(page, request, email, e2ePasswordValid);
    await page.goto("/dashboard");
    await expect(page.getByTestId("page-dashboard")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("nav-link-admin")).toHaveCount(0, { timeout: 25_000 });
    await expect(page.getByTestId("dashboard-sidebar-nav")).toBeVisible();
  });

  test("สรุป audit (UI placeholder) แสดงเมื่อเป็นแอดมิน", async ({ page, request }) => {
    test.skip(!hasAdminCredentials(), "ตั้ง E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

    await clearClientAuth(page);
    await injectUserSession(page, request, e2eAdminUser.email, e2eAdminUser.password);

    await page.goto("/dashboard/admin");
    await expect(page.getByTestId("admin-dashboard-content")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-audit-summary")).toBeVisible();
    await expect(page.getByTestId("admin-audit-summary")).toContainText(/audit/i);
  });
});
