/**
 * อ่านค่าการเชื่อมต่อฐานข้อมูลจาก process.env (หลังโหลด `.env.test`)
 * ใช้ร่วมกับ seed/helper หรือสคริปต์เทสที่ต้องสร้าง DataSource แยกจาก Nest
 */
export interface TestDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
  ssl: boolean;
}

function readRequired(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(`ตั้งค่า ${name} ใน .env.test ก่อนใช้ test database config`);
  }
  return v;
}

export function getTestDatabaseConfig(): TestDatabaseConfig {
  return {
    host: readRequired('DB_HOST'),
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: readRequired('DB_USER'),
    password: readRequired('DB_PASSWORD'),
    database: readRequired('DB_NAME'),
    schema: process.env.DB_SCHEMA ?? 'public',
    ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1',
  };
}
