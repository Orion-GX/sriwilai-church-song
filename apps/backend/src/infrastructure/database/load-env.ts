import { config } from 'dotenv';
import { relative, resolve } from 'path';

/** รากแพ็กเกจ backend (`apps/backend`) ทั้งตอนรันจาก `src/` (ts-node) และ `dist/` */
const backendRoot = resolve(__dirname, '../../..');

/**
 * เลือกไฟล์ env สำหรับ TypeORM CLI / DataSource
 * - ค่าเริ่มต้น: `.env`
 * - `yarn migration:run:test` ตั้งเป็น `.env.test`
 */
const nameFromEnv = process.env.SRIWILAI_DOTENV?.trim();
const envSegment = nameFromEnv && nameFromEnv.length > 0 ? nameFromEnv : '.env';
const pathToEnv = resolve(backendRoot, envSegment);
const rel = relative(backendRoot, pathToEnv);
if (rel.startsWith('..') || rel.includes('..')) {
  throw new Error(`SRIWILAI_DOTENV must resolve inside backend root (got: ${envSegment})`);
}

config({ path: pathToEnv });
