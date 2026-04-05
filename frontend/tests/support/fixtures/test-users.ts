/**
 * ข้อมูลผู้ใช้สำหรับ E2E — ตั้งใน `.env.test` หรือส่งจาก CI
 * บัญชีจริงต้องมีอยู่บน backend ที่ frontend ชี้ไป (ลงทะเบียนล่วงหน้าหรือใช้ seed)
 */
export const e2eTestUser = {
  email: process.env.E2E_USER_EMAIL ?? "playwright-smoke@example.test",
  password: process.env.E2E_USER_PASSWORD ?? "Playwright_smoke_1!",
} as const;

/**
 * บัญชีที่สร้าง/แก้ไขเพลงผ่าน UI — ต้องมีสิทธิ์ song.create และ song.update
 * (เช่น system_admin แบบ global) เพราะ role `user` ส่วนตัวมีแค่ song.read
 */
export const e2eSongEditor = {
  email: process.env.E2E_SONG_EDITOR_EMAIL?.trim() ?? "",
  password: process.env.E2E_SONG_EDITOR_PASSWORD ?? "",
} as const;

export function hasSongEditorCredentials(): boolean {
  return Boolean(e2eSongEditor.email && e2eSongEditor.password);
}

/**
 * system.admin — ใช้ทดสอบแดชบอร์ดแอดมิน (มอบ role system_admin ในฐานข้อมูล)
 */
export const e2eAdminUser = {
  email: process.env.E2E_ADMIN_EMAIL?.trim() ?? "",
  password: process.env.E2E_ADMIN_PASSWORD ?? "",
} as const;

export function hasAdminCredentials(): boolean {
  return Boolean(e2eAdminUser.email && e2eAdminUser.password);
}

/**
 * สองบัญชีสำหรับ E2E ไลฟ์ multi-browser — ต้องมี LIVE_READ (+ LIVE_MANAGE สำหรับ leader)
 * กับเซสชัน churchId = null (ไม่ส่ง X-Church-Id) เช่น system_admin ทั้งคู่
 */
export const e2eLiveLeader = {
  email: process.env.E2E_LIVE_LEADER_EMAIL?.trim() ?? "",
  password: process.env.E2E_LIVE_LEADER_PASSWORD ?? "",
} as const;

export const e2eLiveFollower = {
  email: process.env.E2E_LIVE_FOLLOWER_EMAIL?.trim() ?? "",
  password: process.env.E2E_LIVE_FOLLOWER_PASSWORD ?? "",
} as const;

export function hasLiveMultiCredentials(): boolean {
  return Boolean(
    e2eLiveLeader.email &&
      e2eLiveLeader.password &&
      e2eLiveFollower.email &&
      e2eLiveFollower.password,
  );
}

/** Base URL ของ Nest API สำหรับ `apiLogin` — ต้องตรงกับที่ frontend เรียก (ดู NEXT_PUBLIC_API_URL) */
export function getApiBaseForPlaywright(): string {
  const fromEnv = process.env.E2E_API_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  return "http://127.0.0.1:3001/api/v1";
}
