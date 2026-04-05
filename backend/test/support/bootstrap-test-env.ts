import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const DEFAULT_ENV_RELATIVE = '.env.test';

/**
 * โหลด environment สำหรับเทสจากไฟล์ (ค่าเริ่มต้น: `backend/.env.test`)
 * Jest E2E โหลดผ่าน `test/setup/jest-env.cjs` อยู่แล้ว — ใช้ฟังก์ชันนี้เมื่อรันสคริปต์/เทสแยกนอก Jest
 */
export function loadTestEnvironment(envFilePath?: string): void {
  const pathToLoad = envFilePath ?? resolve(process.cwd(), DEFAULT_ENV_RELATIVE);
  if (!existsSync(pathToLoad)) {
    throw new Error(
      `ไม่พบไฟล์ ${pathToLoad} — คัดลอกจาก .env.test.example แล้วตั้งค่า DB/Redis/auth ให้ครบ`,
    );
  }
  config({ path: pathToLoad, override: true });
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
}
