import { expect, test } from "@playwright/test";

import { e2ePasswordValid, uniqueRegisterEmail } from "../support/helpers/auth-ui";
import { clearClientAuth } from "../support/helpers/navigation";
import { injectUserSession } from "../support/helpers/songs-e2e";
import { getApiBaseForPlaywright } from "../support/fixtures/test-users";

test.describe.serial("โปรไฟล์และคริสตจักร", () => {
  let ownerEmail = "";
  let churchId = "";
  let churchName = "";
  let newDisplayName = "";

  test("ลงทะเบียน — เปิดหน้าโปรไฟล์", async ({ page, request }, testInfo) => {
    ownerEmail = uniqueRegisterEmail(testInfo.workerIndex + 400);
    const registerRes = await request.post(`${getApiBaseForPlaywright()}/app/auth/register`, {
      data: {
        displayName: "ผู้ใช้ E2E เริ่มต้น",
        email: ownerEmail,
        password: e2ePasswordValid,
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(registerRes.ok(), await registerRes.text()).toBeTruthy();

    await clearClientAuth(page);
    await injectUserSession(page, request, ownerEmail, e2ePasswordValid);

    await page.goto("/dashboard/profile");
    await expect(page.getByTestId("page-profile")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("profile-form")).toBeVisible();
    await expect(page.getByTestId("profile-loading")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("profile-email")).toHaveValue(ownerEmail);
    await expect(page.getByTestId("profile-display-name-input")).toHaveValue(/ผู้ใช้ E2E/);
  });

  test("อัปเดตชื่อที่แสดง — persistence หลังรีโหลด", async ({ page, request }) => {
    await clearClientAuth(page);
    await injectUserSession(page, request, ownerEmail, e2ePasswordValid);

    newDisplayName = `PW-Profile-${Date.now()}`;
    await page.goto("/dashboard/profile");
    await expect(page.getByTestId("profile-display-name-input")).toBeVisible();
    await page.getByTestId("profile-display-name-input").fill(newDisplayName);
    await page.getByTestId("profile-submit").click();
    await expect(page.getByTestId("profile-error")).toHaveCount(0);
    await expect(page.getByTestId("profile-display-name-input")).toHaveValue(newDisplayName);

    await page.reload();
    await expect(page.getByTestId("profile-loading")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("profile-display-name-input")).toHaveValue(newDisplayName);
  });

  test("สร้างคริสตจักร — ไปหน้าจัดการ", async ({ page, request }) => {
    await clearClientAuth(page);
    await injectUserSession(page, request, ownerEmail, e2ePasswordValid);

    churchName = `PW-Church-${Date.now()}`;
    await page.goto("/dashboard/churches/new");
    await expect(page.getByTestId("page-church-new")).toBeVisible();
    await page.getByTestId("church-input-name").fill(churchName);
    await page.getByTestId("church-submit").click();
    await page.waitForURL(/\/dashboard\/churches\/[0-9a-f-]{8}-/i, { timeout: 20_000 });
    const parts = new URL(page.url()).pathname.split("/").filter(Boolean);
    expect(parts[0]).toBe("dashboard");
    expect(parts[1]).toBe("churches");
    churchId = parts[2] ?? "";
    expect(churchId.length).toBeGreaterThan(10);
    await expect(page.getByTestId("church-manage-content")).toBeVisible();
    await expect(page.getByTestId("church-manage-title")).toHaveText(churchName);
  });

  test("ดูรายการคริสตจักรที่เป็นเจ้าของ", async ({ page, request }) => {
    await clearClientAuth(page);
    await injectUserSession(page, request, ownerEmail, e2ePasswordValid);

    await page.goto("/dashboard/churches");
    await expect(page.getByTestId("page-churches")).toBeVisible();
    await expect(page.getByTestId("church-list-loading")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId(`church-row-${churchId}`)).toBeVisible();
    await expect(page.getByTestId(`church-row-${churchId}`)).toContainText(churchName);
    await expect(page.getByTestId(`church-manage-link-${churchId}`)).toBeVisible();
  });

  test("ผู้ใช้ที่ไม่มีสิทธิ์ — หน้าจัดการคริสตจักรไม่แสดงเนื้อหา", async ({
    page,
    request,
  }, testInfo) => {
    const outsiderEmail = uniqueRegisterEmail(testInfo.workerIndex + 500);
    const outsiderRes = await request.post(`${getApiBaseForPlaywright()}/app/auth/register`, {
      data: {
        displayName: "Outsider E2E",
        email: outsiderEmail,
        password: e2ePasswordValid,
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(outsiderRes.ok(), await outsiderRes.text()).toBeTruthy();

    await clearClientAuth(page);
    await injectUserSession(page, request, outsiderEmail, e2ePasswordValid);

    await page.goto(`/dashboard/churches/${churchId}/manage`);
    await expect(page.getByTestId("page-church-manage")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("church-manage-loading")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("church-manage-error")).toBeVisible();
    await expect(page.getByTestId("church-manage-content")).toHaveCount(0);
  });
});
