import { expect, test } from "@playwright/test";

import { apiLogin } from "../support/helpers/api-auth";
import {
  createLiveSessionViaApi,
  endLiveSessionViaApi,
  expectLiveSongIndex,
  fetchPublishedSongs,
  focusLiveRoomForKeyboard,
  openLiveRoomAsUser,
  waitForLiveSocketConnected,
} from "../support/helpers/live-e2e";
import {
  e2eLiveFollower,
  e2eLiveLeader,
  hasLiveMultiCredentials,
} from "../support/fixtures/test-users";

/**
 * สมมติฐาน:
 * - โหมดไลฟ์ใช้ดัชนีเพลงในลิสต์เป็น “หน้า” หลักสำหรับ MVP (pedal มักแมปเป็น Arrow / Page)
 * - Leader กด ArrowRight / PageDown = เพลงถัดไป, ArrowLeft / PageUp = เพิ่มก่อนหน้า (เหมือนปุ่มใหญ่)
 * - เมื่อ follower เปิดตาม leader การเปลี่ยนจาก leader จะอัปเดตดัชนีผู้ตามผ่าน sync
 * - ลัดคิดไม่ทำงานขณะโฟกัส input/textarea (และเมื่อ follower ตามอยู่จะไม่มีโหมดนำทางท้องถิ่น)
 */
test.describe("ไลฟ์ — ลัดคีย์เปลี่ยนเพลง (pedal-friendly)", () => {
  test("leader ลัดคีย์ + UI ดัชนี + follower ตาม sync", async ({ browser }) => {
    test.skip(
      !hasLiveMultiCredentials(),
      "ตั้ง E2E_LIVE_LEADER_* และ E2E_LIVE_FOLLOWER_* (เช่น system_admin ทั้งคู่)",
    );

    const leaderContext = await browser.newContext();
    const followerContext = await browser.newContext();
    const leaderPage = await leaderContext.newPage();
    const followerPage = await followerContext.newPage();
    const sessionTitle = `PW-Live-Key-${Date.now()}`;
    let sessionId = "";

    try {
      const [songA, songB] = await fetchPublishedSongs(leaderContext.request, 2);

      const leaderAuth = await apiLogin(
        leaderContext.request,
        e2eLiveLeader.email,
        e2eLiveLeader.password,
      );
      const created = await createLiveSessionViaApi(
        leaderContext.request,
        leaderAuth.accessToken,
        sessionTitle,
      );
      sessionId = created.id;

      await openLiveRoomAsUser(
        leaderPage,
        leaderContext.request,
        e2eLiveLeader.email,
        e2eLiveLeader.password,
        sessionId,
      );
      await openLiveRoomAsUser(
        followerPage,
        followerContext.request,
        e2eLiveFollower.email,
        e2eLiveFollower.password,
        sessionId,
      );
      await waitForLiveSocketConnected(leaderPage);
      await waitForLiveSocketConnected(followerPage);

      await leaderPage.getByTestId("live-add-song-id").fill(songA.id);
      await leaderPage.getByTestId("live-add-song-submit").click();
      await expect(leaderPage.getByTestId("live-queue-item-0")).toContainText(songA.title, {
        timeout: 20_000,
      });
      await leaderPage.getByTestId("live-add-song-id").fill(songB.id);
      await leaderPage.getByTestId("live-add-song-submit").click();
      await expect(leaderPage.getByTestId("live-queue-item-1")).toContainText(songB.title, {
        timeout: 20_000,
      });

      await expectLiveSongIndex(leaderPage, 0, 2);
      await expect(leaderPage.getByTestId("live-queue-item-0")).toHaveClass(/border-primary/);

      await focusLiveRoomForKeyboard(leaderPage);
      await leaderPage.keyboard.press("ArrowRight");
      await expectLiveSongIndex(leaderPage, 1, 2);
      await expect(leaderPage.getByTestId("live-current-song-label")).toContainText(songB.title);
      await expect(leaderPage.getByTestId("live-queue-item-1")).toHaveClass(/border-primary/);

      await leaderPage.keyboard.press("ArrowLeft");
      await expectLiveSongIndex(leaderPage, 0, 2);
      await expect(leaderPage.getByTestId("live-current-song-label")).toContainText(songA.title);

      await leaderPage.keyboard.press("PageDown");
      await expectLiveSongIndex(leaderPage, 1, 2);
      await leaderPage.keyboard.press("PageUp");
      await expectLiveSongIndex(leaderPage, 0, 2);

      await leaderPage.getByTestId("live-add-song-id").click();
      await leaderPage.keyboard.press("ArrowRight");
      await expectLiveSongIndex(leaderPage, 0, 2);
      await leaderPage.keyboard.press("PageDown");
      await expectLiveSongIndex(leaderPage, 1, 2);
      await leaderPage.getByTestId("live-add-song-id").click();
      await leaderPage.keyboard.press("ArrowLeft");
      await expectLiveSongIndex(leaderPage, 1, 2);
      await focusLiveRoomForKeyboard(leaderPage);
      await leaderPage.keyboard.press("PageUp");
      await expectLiveSongIndex(leaderPage, 0, 2);

      await followerPage.getByTestId("live-follow-toggle").click();
      await expect(followerPage.getByTestId("live-follow-toggle")).toContainText("หยุดตาม", {
        timeout: 15_000,
      });
      await expectLiveSongIndex(followerPage, 0, 2);

      await focusLiveRoomForKeyboard(leaderPage);
      await leaderPage.keyboard.press("ArrowRight");
      await expectLiveSongIndex(leaderPage, 1, 2);
      await expectLiveSongIndex(followerPage, 1, 2, 25_000);
      await expect(followerPage.getByTestId("live-current-song-label")).toContainText(songB.title);
      await expect(followerPage.getByTestId("live-queue-item-1")).toHaveClass(/border-primary/);
    } finally {
      if (sessionId) {
        try {
          const tok = await apiLogin(
            leaderContext.request,
            e2eLiveLeader.email,
            e2eLiveLeader.password,
          );
          await endLiveSessionViaApi(leaderContext.request, tok.accessToken, sessionId);
        } catch {
          /* noop */
        }
      }
      await leaderContext.close();
      await followerContext.close();
    }
  });
});
