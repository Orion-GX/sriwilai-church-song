/**
 * อีเมลคงที่สำหรับ Auth E2E — ลบออกด้วย cleanup ก่อน/หลังชุดเทส
 * (ใช้เฉพาะกับฐานข้อมูล test)
 */
export const AUTH_E2E_FIXTURE_EMAILS = {
  registerOk: 'auth-e2e-register@example.test',
  duplicate: 'auth-e2e-duplicate@example.test',
  loginOk: 'auth-e2e-login@example.test',
  me: 'auth-e2e-me@example.test',
  refreshFlow: 'auth-e2e-refresh@example.test',
  logoutFlow: 'auth-e2e-logout@example.test',
} as const;

/** รหัสผ่านเดียวกันทุกเคส — ผ่าน validation ขั้นต่ำ */
export const AUTH_E2E_PASSWORD = 'AuthE2E_pass_9';

export const AUTH_E2E_DISPLAY_NAME = 'Auth E2E';

export function authE2ERegisterBody(email: string): {
  email: string;
  password: string;
  displayName: string;
} {
  return {
    email,
    password: AUTH_E2E_PASSWORD,
    displayName: AUTH_E2E_DISPLAY_NAME,
  };
}
