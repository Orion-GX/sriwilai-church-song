# Playwright E2E (frontend)

## การติดตั้งครั้งแรก

```bash
cd apps/frontend
yarn playwright:install
```

## ตั้งค่า

1. คัดลอก `apps/frontend/.env.test.example` → `apps/frontend/.env.test`
2. ปรับ `PLAYWRIGHT_BASE_URL` ถ้าเดฟไม่ใช้พอร์ต 3000
3. ถ้าใช้ helper **`apiLogin`** ให้ตั้ง `E2E_API_BASE_URL` และบัญชี `E2E_USER_*` ให้ตรงกับ backend

## รันเทส

```bash
# เปิด dev server อัตโนมัติ (reuse ถ้ามีอยู่แล้ว)
yarn test:e2e

# UI mode
yarn test:e2e:ui

# มี Next รันอยู่แล้ว — ไม่ให้ Playwright สตาร์ทซ้ำ
PLAYWRIGHT_NO_WEB_SERVER=1 yarn test:e2e

# CI / เมื่อ `next dev` ทำให้ EMFILE (too many open files): build แล้วใช้ production server
yarn build && PLAYWRIGHT_USE_PROD_SERVER=1 yarn test:e2e
```

## กลยุทธ์ selector (แนะนำ)

| ลำดับความนิยม | เมื่อไหร่ควรใช้ |
|----------------|-----------------|
| **`data-testid`** | องค์ประกอบที่ใช้ทดสอบโดยเฉพาะ — คงที่ข้ามธีม/คลาส Tailwind |
| **role + accessible name** | ปุ่ม/ลิงก์ที่มีข้อความให้ผู้ใช้อ่านชัด — ดีต่อ a11y |
| **placeholder / label** | input ฟอร์ม (เรามี `data-testid` บนฟอร์มล็อกอินแล้ว) |

หลีกเลี่ยง: selector จากคลาส CSS ของ Tailwind ที่อาจเปลี่ยนบ่อย, โครงสร้าง DOM ลึกเกินจำเป็น

รายการ `data-testid` หลักที่มีในแอป:

- `page-home` — หน้าแรก (marketing)
- `page-auth-shell` — shell หน้า auth
- `login-form`, `login-input-email`, `login-input-password`, `login-submit`
- `auth-gate-loading` — ระหว่าง rehydrate / ก่อน redirect แดชบอร์ด
- `page-dashboard` — ภาพรวมแดชบอร์ด
- `nav-brand` — โลโก้ใน header

## โครงสร้างโฟลเดอร์

```
apps/frontend/
  playwright.config.ts
  tests/
    e2e/           # สเปก
    support/
      fixtures/    # ข้อมูลทดสอบ / unknown env
      helpers/     # นำทาง, apiLogin, ฯลฯ
```

## Auth helper

- **ผ่าน UI:** กรอก `getByTestId('login-input-email')` แล้ว submit — เหมาะกับเทส flow จริง
- **API-assisted:** `apiLogin(request, email, password)` แล้วเขียน `localStorage` key `ccp-auth` ด้วย `zustandAuthLocalStorageScript` — เร็ว เหมาะ setup ที่มี backend คงที่

ไฟล์: `tests/support/helpers/api-auth.ts`

## หมายเหตุ

- แดชบอร์ด (`/dashboard/**`) มี **DashboardAuthGate** — ไม่มี access token จะถูกส่งไป `/login?next=...`
- Playwright รายงาน HTML อยู่ที่ `playwright-report/` (อยู่ใน `.gitignore`)
