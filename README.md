# sriwilai-church-song

## Backend

โค้ด backend อยู่ที่ `backend`

### ติดตั้ง dependencies

```bash
cd backend
yarn install
```

### รันโหมดพัฒนา

```bash
yarn start:dev
```

### Build production

```bash
yarn build
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
cd backend
cp .env.example .env   # ถ้ายังไม่มี
yarn migration:run
# yarn migration:revert
# yarn migration:show
```

### Docker Compose (api + postgres + redis)

```bash
cd backend
cp .env.example .env
docker compose up -d --build
```