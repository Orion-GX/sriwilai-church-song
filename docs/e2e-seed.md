# E2E seed (ผู้ใช้ + เพลง)

แหล่งความจริงเดียวของอีเมล/รหัสผ่าน/สลักเพลงอยู่ที่ **`e2e-seed.config.json`** (รากโปรเจกต์)

## ขั้นตอน

1. ให้ Postgres + Redis พร้อม แล้วตั้ง `backend/.env.test` (คัดลอกจาก `.env.test.example`)
2. รัน migration ทดสอบ: `cd backend && yarn migration:run:test`
3. รัน seed: **`yarn seed:e2e`** จากรากโปรเจกต์ (หรือ `cd backend && yarn seed:e2e`)
4. คัดลอกบล็อก `# คัดลอกไป frontend/.env.test` ที่สคริปต์พิมพ์ตอนจบ ไปใส่ใน `frontend/.env.test` (หรือใช้ค่าเดียวกันใน CI)

## Playwright

- ต้องมี `PLAYWRIGHT_BASE_URL` ชี้ Next และ `E2E_API_BASE_URL` ชี้ Nest (`/api/v1`)
- บัญชี `E2E_SONG_EDITOR_*`, `E2E_ADMIN_*`, `E2E_LIVE_LEADER_*`, `E2E_LIVE_FOLLOWER_*` ต้องตรงกับ seed

## สตาร์ท Nest + Next บรรทัดเดียว

จากรากโปรเจกต์ (หลัง `yarn install` ที่รากครั้งแรกเพื่อดึง `concurrently`):

```bash
yarn dev:stack
```

Nest ฟัง `PORT` ค่าเริ่มต้น **3099** (ตั้งใน `backend/.env` หรือส่งผ่าน env), Next ใช้ `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_ORIGIN` ไปที่ `http://127.0.0.1:3099` อัตโนมัติจากสคริปต์

## GitHub Actions

Workflow **`e2e-playwright.yml`** จะ migrate → seed → สตาร์ท API + Next → รัน Playwright (ดูไฟล์ workflow สำหรับรายละเอียด)
