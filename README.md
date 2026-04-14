# sriwilai-church-song

โมโนด้วย **Yarn Workspaces** — รากโปรเจกต์เป็นจุดรันหลัก (`yarn install`, `yarn dev`, …)

## โครงสร้าง

- `apps/backend` — NestJS API (`@app/backend`)
- `apps/frontend` — Next.js (`@app/frontend`)

## ติดตั้ง (ครั้งเดียวที่ราก)

```bash
yarn install
```

## รันพร้อมกัน (API + Next ใน dev)

```bash
yarn dev
```

หรือแยกเทอร์มินัล:

```bash
yarn dev:backend
yarn dev:frontend
```

## คำสั่งรากอื่น ๆ

| คำสั่ง | ความหมาย |
|--------|-----------|
| `yarn build` | build backend แล้วตามด้วย frontend |
| `yarn build:backend` / `yarn build:frontend` | build แอปเดียว |
| `yarn start` | รัน production build ทั้งคู่ (ต้อง `yarn build` ก่อน) |
| `yarn lint` | lint ทั้งสองแอป |
| `yarn test` | เทส backend (Jest) แล้วตามด้วย frontend (Playwright) |
| `yarn seed:e2e` | seed ข้อมูล E2E (รันที่ backend workspace) |

## Backend

โค้ด backend อยู่ที่ `apps/backend`

### รันโหมดพัฒนา (แยก)

```bash
yarn dev:backend
# หรือ
cd apps/backend && yarn start:dev
```

### Build production

```bash
yarn build:backend
```

### Rate limiting (หลาย instance)

ค่า `THROTTLE_USE_REDIS=true` (ค่าเริ่มต้น) จะใช้ **Redis** เป็นที่เก็บ state ของ `@nestjs/throttler` เพื่อให้ rate limit สอดคล้องกันข้ามหลาย replica  
ถ้าต้องการใช้ in-memory ของ throttler (เช่น dev เดี่ยว) ตั้ง `THROTTLE_USE_REDIS=false`

### RBAC (roles / permissions)

- ตาราง: `churches`, `permissions`, `roles`, `role_permissions`, `user_roles` (scope `global` | `church` + `scope_id` → `churches`)
- Seed role เริ่มต้น: `system_admin`, `church_owner`, `church_admin`, `worship_leader`, `member`, `viewer`, `user` (personal scope; migration `1742563204200`)
- Decorator: `@Roles('system_admin')` (OR), `@Permissions('song.read','song.update')` (AND), `@RequireChurchId()` + header `x-church-id` สำหรับ role/permission ระดับคริสตจักร
- Guard ลงทะเบียนใน `AppModule` ตามลำดับ: `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`
- มอบสิทธิ์ผู้ใช้: insert ลง `user_roles` (เช่น `system_admin` + `scope_type='global'`, `scope_id` NULL)
- ผู้ใช้ที่ยังไม่ผูก church ใช้ role `user` (`scope_type='personal'`, `scope_id` = NULL) เพื่อสร้าง/แชร์ setlist ส่วนตัวได้
- ตัวอย่าง endpoint: `POST /api/v1/app/setlists/personal` (ต้องมี `setlist.personal.manage`)

### Database migrations (TypeORM)

```bash
cd apps/backend
cp .env.example .env   # ถ้ายังไม่มี
yarn migration:run
# yarn migration:revert
# yarn migration:show
```

### Docker Compose (api + postgres + redis)

```bash
cd apps/backend
cp .env.example .env
docker compose up -d --build
```

บิลด์ API ใช้ context ที่รากโปรเจกต์ (ดู `apps/backend/docker-compose.yml` และ `apps/backend/Dockerfile`)

## Ngrok via Docker (dev/test)

ตั้งค่าครั้งแรก:

```bash
cp .env.ngrok.example .env.ngrok
```

### แบบ 1: HTTP tunnel ตรงไปยัง local app (`port 3000`)

```bash
docker compose -f docker-compose.ngrok.yml up -d ngrok-http
# หรือใช้ shortcut
yarn ngrok:http
```

### แบบ 2: Config-based tunnel ผ่าน `ngrok.yml`

```bash
docker compose -f docker-compose.ngrok.yml --profile config up -d ngrok-config
# หรือใช้ shortcut
yarn ngrok:config
```

เปิด ngrok inspection UI ได้ที่ `http://localhost:4040`

### Integrate กับ compose หลัก (ไม่กระทบของเดิม)

รัน stack หลักพร้อม ngrok โดย compose layering:

```bash
docker compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d nginx ngrok-http
```

### เลือก target ให้ถูกต้อง

- ถ้า app รันใน container: ตั้ง `NGROK_TARGET` เป็น service URL ได้เลย เช่น `http://web:3000` หรือ `http://nginx:80`
- ถ้า app รันบน host machine:
  - Mac/Windows: ใช้ `http://host.docker.internal:3000`
  - Linux: บางเครื่องต้องมี `extra_hosts: ["host.docker.internal:host-gateway"]` (ไฟล์ `docker-compose.ngrok.yml` ใส่ไว้แล้ว)

คำสั่งเสริม:

```bash
yarn ngrok:up
yarn ngrok:logs
yarn ngrok:down
```

### Full loop (กันปัญหา frontend เรียก backend ผ่าน localhost ไม่ได้)

แนวคิดคือทำให้ browser คุยกับ path เดียวกันบน ngrok domain (`/api/v1`, `/socket.io`) แล้วให้ Next dev server rewrite ไป backend ภายในเครื่อง:

1) รัน backend + frontend โหมด proxy

```bash
yarn dev:public
```

2) ตั้ง target ngrok ไป frontend dev

```bash
# ใน .env.ngrok
NGROK_TARGET=http://host.docker.internal:3000
```

3) เปิด ngrok

```bash
yarn ngrok:up
```

4) เอา public URL จาก log

```bash
docker logs --tail 50 sriwilai-ngrok-http
```

จะเห็นบรรทัด `started tunnel` พร้อม URL เช่น `https://xxxx.ngrok-free.app`

5) ตรวจว่า API ผ่าน tunnel ได้จริง

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://<your-ngrok-domain>/api/v1/health
```

ควรได้ `200`

หมายเหตุ:
- ถ้า port `3000` ถูกใช้อยู่ ให้รัน frontend proxy คนละพอร์ต เช่น `yarn dev:frontend:proxy -- -p 3010` แล้วเปลี่ยน `NGROK_TARGET` เป็น `http://host.docker.internal:3010`
- ถ้าเห็น `EMFILE` บน macOS/Linux ให้เพิ่ม file watcher limit ของเครื่อง หรือปิดโปรเซส dev อื่นที่เปิด watch จำนวนมาก

### Stable mode สำหรับมือถือ (แนะนำเวลาแชร์ iPad/iPhone)

ถ้าเจออาการ direct link แล้ว CSS/JS ไม่ครบใน Safari/Chrome มือถือ ให้ใช้ production frontend (`next start`) แทน dev server:

1) รันโหมดเสถียร (build + backend dev + frontend production)

```bash
yarn public:start
```

2) ตรวจ `.env.ngrok` ให้ target ชี้ frontend ที่ port 3000

```bash
NGROK_TARGET=http://host.docker.internal:3000
```

3) เปิด ngrok

```bash
yarn ngrok:up
```

4) ดึง URL ล่าสุดแล้วส่งให้ทีม

```bash
docker logs --tail 50 sriwilai-ngrok-http
```
