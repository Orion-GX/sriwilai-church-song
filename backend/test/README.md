# Backend E2E / Integration Tests

เอกสารนี้สรุป **ชุดทดสอบแบบ end-to-end** ของ API (และบางโมดูลมี WebSocket) ใน `backend/test/` พร้อมวิธีเตรียมสภาพแวดล้อมและรันคำสั่ง

## สิ่งที่ต้องมีก่อนรัน

1. **PostgreSQL** ฐานข้อมูลสำหรับเทส (แยกจาก dev ถ้าเป็นไปได้)
2. **ไฟล์ `backend/.env.test`** — คัดลอกจาก `.env.test.example` แล้วตั้งค่า `DB_*` ให้ตรงกับ Postgres ที่ใช้ทดสอบ
3. **รัน migration บนฐานเทส** (จากโฟลเดอร์ `backend`):

   ```bash
   yarn migration:run:test
   ```

4. **Redis** — จำเป็นต่อบางค่า config (เช่น throttler); ใน `.env.test.example` มักตั้ง `THROTTLE_USE_REDIS=false` และ `LIVE_WS_USE_REDIS_ADAPTER=false` เพื่อลด dependency ตอนรันเครื่องเดียว

### Seed บัญชี + เพลงสำหรับ Playwright (optional)

- แหล่งความจริงเดียว: `e2e-seed.config.json` ที่รากโปรเจกต์  
- หลัง migrate แล้วรัน **`yarn seed:e2e`** จากรากโปรเจกต์ (ดู `docs/e2e-seed.md`)  
- คัดลอกบล็อก env ที่สคริปต์พิมพ์ตอนจบไปที่ `frontend/.env.test`

## คำสั่งรันเทส

```bash
# รันชุด E2E ทั้งหมด (เรียงแบบ in-band)
yarn test:e2e

# รันเฉพาะไฟล์ (เช่น pattern)
yarn test:e2e --testPathPattern=songs.e2e-spec
yarn test:e2e --testPathPattern=live.e2e-spec
```

แอปถูกสร้างผ่าน `createConfiguredTestApplication()` ใน `test/support/test-app.factory.ts` — **จำลองการตั้งค่าเดียวกับ `configureApplication` (รวม Socket.IO adapter)**  
โมดูล **Live** ใช้ `createListeningTestApplication()` เพิ่มเติมเพื่อเปิดพอร์ตจริงสำหรับ `socket.io-client`

---

## สรุป Test Cases ตามไฟล์

### `health.e2e-spec.ts` — Health

| รายการ | สิ่งที่ Covered |
|--------|------------------|
| GET health | `GET /api/v1/health` คืน 200 และสถานะปกติ |

### `auth.e2e-spec.ts` — Auth

| กลุ่ม | สิ่งที่ Covered |
|--------|------------------|
| Register | 201, token, refresh cookie, audit |
| Register duplicate email | 401 |
| Login | 200, audit |
| Login รหัสผิด | 401, audit |
| GET /auth/me | Bearer ถูกต้อง / ไม่มีหรือผิด → 401 |
| Refresh | สำเร็จ; ไม่มี cookie / JWT ผิด / หมดอายุ / หลัง revoke → 401 |
| Logout | สำเร็จ, audit; หมายเหตุ access token ไม่ถูก revoke ฝั่ง server จนกว่า JWT จะหมดอายุ |

### `users.e2e-spec.ts` — Users / Profile

| กลุ่ม | สิ่งที่ Covered |
|--------|------------------|
| List users | `system_admin` ได้รายการแบบ paginated; user ทั่วไป 403; ไม่ส่ง JWT 401 |
| GET/PATCH `/users/me` | อ่าน/แก้ displayName; forbid ฟิลด์เกิน whitelist → 400; ไม่มี Bearer 401 |
| PATCH `/users/:id` | admin แก้ผู้อื่นได้; user ทั่วไป 403 |
| Permission guard | `/me` ใช้แค่ JWT; endpoint ที่มี `@Permissions` ต้องมีรหัสสิทธิ์ใน role |

### `churches.e2e-spec.ts` — Churches

| กลุ่ม | สิ่งที่ Covered |
|--------|------------------|
| สร้างคริสตจักร | ผู้ลงทะเบียนสร้างได้; หลายคริสตจักร slug ไม่ซ้ำ; ไม่มี JWT 401 |
| สิทธิ์เจ้าของ / สมาชิก / ภายนอก | owner อัปเดตได้; คนนอกอัปเดต 404; กฎสมาชิก (member ไม่มี church.read → get รายละเอียด 404) |
| บทบาท | `church_admin` ลบไม่ได้ (404); `church_owner` soft delete ได้ |

### `songs.e2e-spec.ts` — Songs (Public + RBAC)

| กลุ่ม | สิ่งที่ Covered |
|--------|------------------|
| Guest | list เพลง published; อ่าน detail + ChordPro; draft ไม่โผล่ list และ detail 404; สร้างเพลง 401 |
| Church scope | owner สร้างเพลงด้วย `x-church-id`; ไม่มี header แต่มี JWT → 403; owner patch; member ไม่มี song.update → 403 |
| ค้นหา | `q`, `categorySlug`, `tagSlugs`, `churchId` |
| หมวด/แท็ก | categoryId + tagSlugs บันทึกและแสดงใน detail |
| Soft delete | ลบแล้ว public ไม่เห็น |
| View count | แต่ละ GET detail เพิ่ม viewCount |

### `favourites.e2e-spec.ts` — Favourites

| รายการ | สิ่งที่ Covered |
|--------|------------------|
| POST | ล็อกอินเพิ่มโปรด 201; รายการ GET มีเพลงนั้น |
| DELETE | ลบแล้วรายการว่าง |
| GET | แยกตาม user; หลายเพลง; user อื่นไม่เห็นของกัน |
| Duplicate POST | ครั้งสอง 200 `duplicate: true`; แถวในตารางเดียว |
| Guest | GET/POST/DELETE → 401 |

### `live.e2e-spec.ts` — Live (REST + WebSocket)

| # | สิ่งที่ Covered |
|---|------------------|
| 1 | สร้าง live session ทาง REST — leader = ผู้สร้าง, `churchId` ตรง header |
| 2 | เพิ่มเพลงผ่าน `live:songs:add` — client ใน session room ได้ `live:songs:updated` |
| 3 | `live:songs:reorder` — ลำดับตาม `orderedLiveSongIds` |
| 4 | สมาชิกมี `live.read` join follower ได้; outsider `GET` session → 404 |
| 5 | Leader `live:sync:page` — `sync_state` / `pageVersion` ใน DB |
| 6–7 | Follower หลัง `live:follow` รับ `live:sync:broadcast`; ยังไม่ follow ไม่รับ broadcast |
| 8 | Snapshot — GET `/live/sessions/:id` และ `live:sync:request` สอดคล้องสถานะล่าสุด |
| 9 | ชื่อห้อง (`liveSessionRoom`) และชื่อ event ตรงสัญญา |

**สัญญา Socket.IO (namespace, event names, ห้อง):** ดู `test/support/live-event-contract.ts` และโค้ดจริง `src/modules/live/constants/live.events.ts`, `live-rooms.ts`  
**Helper WS:** `test/support/live-ws.helper.ts`

---

## โครงสร้างไฟล์ช่วยใน `test/support/`

| ไฟล์ | หน้าที่โดยย่อ |
|------|----------------|
| `test-app.factory.ts` | สร้างแอปตาม production bootstrap; `createListeningTestApplication()` สำหรับ Live |
| `auth-test.helper.ts`, `auth-e2e.fixtures.ts` | supertest, Bearer, register/login fixture |
| `rbac-e2e.helper.ts` | เช่น `assignSystemAdminRole` |
| `*-e2e.fixtures.ts` / `*-e2e-cleanup.ts` | อีเมล/slug คงที่ + ลบข้อมูลเทสจาก DB ตามลำดับ FK |
| `live-event-contract.ts` | เอกสารอ้างอิง event / room ของ Live |
| `live-ws.helper.ts` | `connectLiveSocket`, `joinLiveSession`, `onceSocketEvent`, ฯลฯ |

---

## หมายเหตุการออกแบบเทส

- **ความเป็นส่วนตัวของสิทธิ์:** หลาย endpoint คืน **404** แทน 403 เพื่อไม่เปิดเผยว่ามีทรัพยากรอยู่
- **Live + persistence:** สถานะซิงก์เก็บใน `live_sessions.sync_state` (JSONB); หลัง `emit` ฝั่ง client อาจต้อง **รอสั้น ๆ / poll** ก่อนยืนยัน REST (ดู `waitForLiveSyncSongIndex` ใน `live.e2e-spec.ts`)
- **Redis adapter:** ถ้าเปิด `LIVE_WS_USE_REDIS_ADAPTER=true` ใน production การทดสอบ multi-instance ต้องพึ่ง Redis แยก; ชุดเทสปัจจุบันเน้น **in-memory adapter** บน process เดียว

หากเพิ่มโมดูลหรือเคสใหม่ แนะนำให้เพิ่ม **fixture prefix + cleanup** ที่คาดการณ์ได้ และรัน `yarn test:e2e` ใน CI หลัง migration ล่าสุด
