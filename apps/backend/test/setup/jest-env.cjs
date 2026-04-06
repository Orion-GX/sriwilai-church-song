const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '../..');
const envPath = path.join(rootDir, '.env.test');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    `[jest-e2e] ไม่พบ ${envPath} — คัดลอกจาก .env.test.example แล้วตั้งค่าก่อนรัน E2E`,
  );
}

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
