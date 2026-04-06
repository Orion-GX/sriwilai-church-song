import { expect, test } from "@playwright/test";

import { e2ePasswordValid, uniqueRegisterEmail } from "../support/helpers/auth-ui";
import { clearClientAuth } from "../support/helpers/navigation";
import { apiRegister } from "../support/helpers/api-auth";
import {
  favoriteButtonForSong,
  injectSongEditorSession,
  injectUserSession,
} from "../support/helpers/songs-e2e";
import { hasSongEditorCredentials } from "../support/fixtures/test-users";

const PLACEHOLDER_SONG_ID = "00000000-0000-4000-8000-000000000001";

test.describe.serial("เพลง — UI และ persistence", () => {
  let songId = "";
  let songTitle = "";
  let songTitleEdited = "";

  test("guest ถูกบล็อกจากหน้าสร้าง/แก้ไขเพลง (แดชบอร์ด)", async ({ page }) => {
    await clearClientAuth(page);

    await page.goto("/dashboard/songs/new");
    await expect(page).toHaveURL(/\/login/);
    const u = new URL(page.url());
    expect(u.searchParams.get("next")).toBe("/dashboard/songs/new");

    await page.goto(`/dashboard/songs/${PLACEHOLDER_SONG_ID}/edit`);
    await expect(page).toHaveURL(/\/login/);
    const u2 = new URL(page.url());
    expect(u2.searchParams.get("next")).toBe(
      `/dashboard/songs/${PLACEHOLDER_SONG_ID}/edit`,
    );
  });

  test("บัญชีแก้ไขเพลง — สร้างเพลงผ่าน UI แล้วเปิดหน้ารายละเอียดสาธารณะ", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(!hasSongEditorCredentials(), "ตั้ง E2E_SONG_EDITOR_EMAIL / E2E_SONG_EDITOR_PASSWORD (แนะนำ system_admin)");

    songTitle = `PW-SONG-${Date.now()}-w${testInfo.workerIndex}`;
    const chordpro = `{title: ${songTitle}}\n[C] E2E lyric`;

    await clearClientAuth(page);
    await injectSongEditorSession(page, request);
    await page.goto("/dashboard/songs/new");
    await expect(page.getByTestId("song-editor-form")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("song-input-title").fill(songTitle);
    await page.getByTestId("song-input-chordpro").fill(chordpro);
    await page.getByTestId("song-submit").click();

    await page.waitForURL(/\/songs\/[0-9a-f-]{8}-/i, { timeout: 20_000 });
    songId = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(songId.length).toBeGreaterThan(10);

    await expect(page.getByTestId("song-detail-title")).toHaveText(songTitle);
    await expect(page.getByTestId("chordpro-view")).toContainText("[C]");
  });

  test("guest เรียกดูรายการเพลง — เห็นเพลงที่สร้าง", async ({ page }) => {
    test.skip(!songId, "ต้องมีขั้นตอนสร้างเพลงก่อน");

    await clearClientAuth(page);
    await page.goto("/songs");
    await expect(page.getByTestId("page-songs-list")).toBeVisible();
    await expect(page.getByTestId("song-list-loading")).toHaveCount(0, {
      timeout: 20_000,
    });
    await expect(page.getByTestId(`song-list-link-${songId}`)).toBeVisible();
    await expect(page.getByTestId(`song-list-link-${songId}`)).toHaveText(songTitle);
  });

  test("guest เปิดรายละเอียดเพลง", async ({ page }) => {
    test.skip(!songId, "ต้องมีขั้นตอนสร้างเพลงก่อน");

    await clearClientAuth(page);
    await page.goto(`/songs/${songId}`);
    await expect(page.getByTestId("page-song-detail")).toBeVisible();
    await expect(page.getByTestId("song-detail-title")).toHaveText(songTitle);
    await expect(page.getByTestId("chordpro-view")).toContainText("[C]");
    await expect(page.getByTestId("song-link-edit")).toHaveCount(0);
  });

  test("แก้ไขเพลงผ่าน UI — ข้อมูลอัปเดตบนหน้าสาธารณะ", async ({
    page,
    request,
  }) => {
    test.skip(!songId || !hasSongEditorCredentials(), "ต้องมีเพลงและบัญชีแก้ไข");

    songTitleEdited = `${songTitle} · edited`;
    const chordproEdited = `{title: ${songTitleEdited}}\n[C] E2E lyric\n[D] แก้แล้ว`;

    await clearClientAuth(page);
    await injectSongEditorSession(page, request);
    await page.goto(`/dashboard/songs/${songId}/edit`);
    await expect(page.getByTestId("song-editor-form")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("song-input-title").fill(songTitleEdited);
    await page.getByTestId("song-input-chordpro").fill(chordproEdited);
    await page.getByTestId("song-submit").click();

    await expect(page).toHaveURL(new RegExp(`/songs/${songId}`, "i"), { timeout: 20_000 });
    await expect(page.getByTestId("song-detail-title")).toHaveText(songTitleEdited);
    await expect(page.getByTestId("chordpro-view")).toContainText("[D]");

    await clearClientAuth(page);
    await page.goto(`/songs/${songId}`);
    await expect(page.getByTestId("song-detail-title")).toHaveText(songTitleEdited);
    await expect(page.getByTestId("chordpro-view")).toContainText("[D]");
  });

  test("ผู้ใช้ล็อกอิน — โปรด/ยกเลิกโปรดคงอยู่หลังรีโหลด", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(!songId, "ต้องมีขั้นตอนสร้างเพลงก่อน");

    const email = uniqueRegisterEmail(testInfo.workerIndex + 900);
    await apiRegister(request, {
      displayName: "Fav E2E",
      email,
      password: e2ePasswordValid,
    });

    await clearClientAuth(page);
    await injectUserSession(page, request, email, e2ePasswordValid);

    await page.goto(`/songs/${songId}`);
    const fav = favoriteButtonForSong(page, songId);
    await expect(fav).toBeVisible({ timeout: 20_000 });
    await expect(fav).toHaveAttribute("aria-pressed", "false");

    await fav.click();
    await expect(fav).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });

    await page.reload();
    await expect(fav).toHaveAttribute("aria-pressed", "true");

    await fav.click();
    await expect(fav).toHaveAttribute("aria-pressed", "false", { timeout: 15_000 });

    await page.reload();
    await expect(fav).toHaveAttribute("aria-pressed", "false");
  });

  test("คอนโทรล transpose — แสดงคีย์ใหม่ในเนื้อเพลง", async ({ page }) => {
    test.skip(!songId, "ต้องมีขั้นตอนสร้างเพลงก่อน");

    await clearClientAuth(page);
    await page.goto(`/songs/${songId}`);
    await expect(page.getByTestId("transpose-bar")).toBeVisible();
    await expect(page.getByTestId("transpose-value")).toHaveText("ต้นฉบับ");
    await expect(page.getByTestId("chordpro-view")).toContainText("[C]");

    await page.getByTestId("transpose-increment").click();
    await expect(page.getByTestId("transpose-value")).toContainText("+1");
    await expect(page.getByTestId("chordpro-view")).toContainText("[C#]");

    await page.getByTestId("transpose-reset").click();
    await expect(page.getByTestId("transpose-value")).toHaveText("ต้นฉบับ");
    await expect(page.getByTestId("chordpro-view")).toContainText("[C]");
  });

  test("ค้นหา — กรองรายการตามคำค้น", async ({ page }) => {
    test.skip(!songId || !songTitleEdited, "ต้องมีเพลงหลังแก้ไข");

    await clearClientAuth(page);
    await page.goto("/songs");
    await expect(page.getByTestId("song-search-input")).toBeVisible();
    await page.getByTestId("song-search-input").fill(songTitleEdited);
    await page.getByTestId("song-search-submit").click();

    await expect(page.getByTestId("song-list-loading")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId(`song-row-${songId}`)).toBeVisible();
    await expect(page.getByTestId(`song-list-link-${songId}`)).toHaveText(songTitleEdited);

    const rows = page.locator('[data-testid^="song-row-"]');
    await expect(rows).toHaveCount(1);
  });
});
