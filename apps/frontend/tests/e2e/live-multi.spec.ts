import { expect, test } from "@playwright/test";

import { apiLogin } from "../support/helpers/api-auth";
import {
  addPublishedSongsToLiveQueue,
  clickLiveNavNext,
  clickLiveNavPrev,
  createLiveSessionViaApi,
  endLiveSessionViaApi,
  expectLiveCurrentSongLabelIs,
  fetchPublishedSongs,
  openLiveRoomAsUser,
  safeEndLiveSession,
  waitForLiveSocketConnected,
} from "../support/helpers/live-e2e";
import {
  e2eLiveFollower,
  e2eLiveLeader,
  hasLiveMultiCredentials,
} from "../support/fixtures/test-users";

/**
 * สมมติฐาน event / state (ตาม implementation ปัจจุบัน):
 *
 * 1. Leader เชื่อม WebSocket แบบ participantMode=leader, follower แบบ follower หลัง REST โหลดห้องแล้ว
 * 2. SYNC_PAGE จาก leader ส่ง SYNC_BROADCAST ไปห้อง followers เท่านั้น — ผู้ที่ live:follow อยู่เท่านั้นจะได้รับการอัปเดตเพลง/เลื่อน
 * 3. เมื่อ join/reconnect ทุกครั้ง server ตั้ง followingLeader=false และ emit JOINED (ฝั่ง client เซ็ตตาม)
 * 4. หลัง reload ผู้ตาม: โหมดตามถูกปิด แต่ดัชนีเพลงตรงกับ syncState ล่าสุดจาก REST เมื่อโหลดหน้า
 * 5. เมื่อ unfollow แล้ว displayIndex กลับไปใช้ localIndex — อาจไม่เท่ากับเพลงที่ leader เล่นอยู่ (พฤติกรรมที่มีอยู่)
 *
 * ความต้องการบัญชี: ทั้งสองบัญชีต้องมี LIVE_READ ในบริบทเดียวกับเซสชัน (churchId=null → เช่น system_admin ทั้งคู่)
 */
test("ไลฟ์ซิงก์สองเบราว์เซอร์ — leader / follower / ตาม / เลิกตาม / reload / เข้า-ออกห้อง", async ({
  browser,
}) => {
  test.skip(
    !hasLiveMultiCredentials(),
    "ตั้ง E2E_LIVE_LEADER_EMAIL, E2E_LIVE_LEADER_PASSWORD, E2E_LIVE_FOLLOWER_EMAIL, E2E_LIVE_FOLLOWER_PASSWORD (แนะนำ system_admin ทั้งคู่ + เซสชันไม่ผูกคริสตจักร)",
  );

  const leaderContext = await browser.newContext();
  const followerContext = await browser.newContext();
  const leaderPage = await leaderContext.newPage();
  const followerPage = await followerContext.newPage();
  const sessionTitle = `PW-Live-Multi-${Date.now()}`;
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

    await expect(leaderPage.getByTestId("live-session-title")).toContainText(sessionTitle);

    await addPublishedSongsToLiveQueue(leaderPage, [songA, songB]);

    await followerPage.getByTestId("live-follow-toggle").click();
    await expect(followerPage.getByTestId("live-follow-toggle")).toContainText("หยุดตาม", {
      timeout: 15_000,
    });

    await clickLiveNavNext(leaderPage);
    await expectLiveCurrentSongLabelIs(leaderPage, songB.title);
    await expectLiveCurrentSongLabelIs(followerPage, songB.title);

    await followerPage.getByTestId("live-follow-toggle").click();
    await expect(followerPage.getByTestId("live-follow-toggle")).toContainText("เริ่มตาม leader", {
      timeout: 15_000,
    });

    await clickLiveNavPrev(leaderPage);
    await expectLiveCurrentSongLabelIs(leaderPage, songA.title);

    await clickLiveNavNext(leaderPage);
    await expectLiveCurrentSongLabelIs(leaderPage, songB.title);

    await expectLiveCurrentSongLabelIs(followerPage, songA.title, 22_000);

    await followerPage.reload();
    await expect(followerPage.getByTestId("live-session-room")).toBeVisible({ timeout: 25_000 });
    await waitForLiveSocketConnected(followerPage);
    await expect(followerPage.getByTestId("live-follow-toggle")).toContainText("เริ่มตาม leader");
    await expectLiveCurrentSongLabelIs(followerPage, songB.title);

    await followerPage.getByTestId("live-back-list").click();
    await expect(followerPage).toHaveURL(/\/dashboard\/live$/);
    await expect(followerPage.getByTestId("page-live-list")).toBeVisible();

    await followerPage.goto(`/dashboard/live/${sessionId}`);
    await expect(followerPage.getByTestId("live-session-room")).toBeVisible({ timeout: 25_000 });
    await waitForLiveSocketConnected(followerPage);

    const leaderAuth2 = await apiLogin(
      leaderContext.request,
      e2eLiveLeader.email,
      e2eLiveLeader.password,
    );
    await endLiveSessionViaApi(leaderContext.request, leaderAuth2.accessToken, sessionId);

    await leaderPage.goto("/dashboard/live");
    await expect(leaderPage.getByTestId("page-live-list")).toBeVisible();
    await expect(leaderPage.locator(`a[href="/dashboard/live/${sessionId}"]`)).toHaveCount(0, {
      timeout: 20_000,
    });

    await followerPage.goto("/dashboard/live");
    await expect(
      followerPage.locator(`a[href="/dashboard/live/${sessionId}"]`),
    ).toHaveCount(0, {
      timeout: 20_000,
    });
  } finally {
    await safeEndLiveSession(
      leaderContext.request,
      e2eLiveLeader.email,
      e2eLiveLeader.password,
      sessionId,
    );
    await leaderContext.close();
    await followerContext.close();
  }
});
