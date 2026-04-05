/**
 * ข้อมูลผู้ใช้สำหรับ E2E — ตั้งใน `.env.test` หรือส่งจาก CI
 * บัญชีจริงต้องมีอยู่บน backend ที่ frontend ชี้ไป (ลงทะเบียนล่วงหน้าหรือใช้ seed)
 */
export const e2eTestUser = {
  email: process.env.E2E_USER_EMAIL ?? "playwright-smoke@example.test",
  password: process.env.E2E_USER_PASSWORD ?? "Playwright_smoke_1!",
} as const;

/** Base URL ของ Nest API สำหรับ `apiLogin` — ต้องตรงกับที่ frontend เรียก (ดู NEXT_PUBLIC_API_URL) */
export function getApiBaseForPlaywright(): string {
  const fromEnv = process.env.E2E_API_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  return "http://127.0.0.1:3001/api/v1";
}
