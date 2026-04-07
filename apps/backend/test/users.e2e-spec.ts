import { HttpStatus, INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AuditLogEntity } from '../src/modules/audit/entities/audit-log.entity';
import { SYSTEM_PERMISSION_CODES } from '../src/modules/rbac/rbac.constants';
import { USER_AUDIT_ACTIONS } from '../src/modules/users/constants/audit-actions';
import { authBearerHeaders, createHttpServerRequest } from './support/auth-test.helper';
import { AUTH_E2E_PASSWORD, authE2ERegisterBody } from './support/auth-e2e.fixtures';
import { assignSystemAdminRole } from './support/rbac-e2e.helper';
import { createConfiguredTestApplication } from './support/test-app.factory';
import { cleanupUsersE2EFixtures } from './support/users-e2e-cleanup';
import { USERS_E2E_EMAILS } from './support/users-e2e.fixtures';

describe('Users & profile API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createConfiguredTestApplication();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  beforeEach(async () => {
    await cleanupUsersE2EFixtures(dataSource);
  });

  afterAll(async () => {
    await cleanupUsersE2EFixtures(dataSource);
    await app.close();
  });

  async function registerAndLogin(email: string): Promise<string> {
    await createHttpServerRequest(app).post('/api/v1/app/auth/register').send(authE2ERegisterBody(email)).expect(HttpStatus.CREATED);
    const res = await createHttpServerRequest(app)
      .post('/api/v1/app/auth/login')
      .send({ email, password: AUTH_E2E_PASSWORD })
      .expect(HttpStatus.OK);
    return res.body.accessToken as string;
  }

  describe('GET /api/v1/app/users (รายการผู้ใช้)', () => {
    it('ผู้ดูแลระบบ (system_admin) เรียก list ได้ — 200 และโครงสร้าง paginated', async () => {
      const reg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(USERS_E2E_EMAILS.admin))
        .expect(HttpStatus.CREATED);

      await assignSystemAdminRole(dataSource, reg.body.user.id as string);
      const token = reg.body.accessToken as string;

      const res = await createHttpServerRequest(app)
        .get('/api/v1/app/users')
        .query({ page: 1, limit: 10 })
        .set(authBearerHeaders(token))
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
      });
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items.some((u: { email: string }) => u.email === USERS_E2E_EMAILS.admin)).toBe(true);
    });

    it('ผู้ใช้ทั่วไปไม่มี user.read — 403 Insufficient permission', async () => {
      const token = await registerAndLogin(USERS_E2E_EMAILS.normal);

      const res = await createHttpServerRequest(app)
        .get('/api/v1/app/users')
        .set(authBearerHeaders(token))
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body).toMatchObject({
        statusCode: 403,
        message: 'Insufficient permission',
      });
    });

    it('ไม่ส่ง Authorization — 401 (JwtAuthGuard ก่อน PermissionsGuard)', async () => {
      await createHttpServerRequest(app).get('/api/v1/app/users').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET/PATCH /api/v1/app/users/me (โปรไฟล์ตนเอง)', () => {
    it('อ่านโปรไฟล์ตัวเองได้ — 200', async () => {
      const reg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(USERS_E2E_EMAILS.profile))
        .expect(HttpStatus.CREATED);

      const token = reg.body.accessToken as string;

      const res = await createHttpServerRequest(app)
        .get('/api/v1/app/users/me')
        .set(authBearerHeaders(token))
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        id: reg.body.user.id,
        email: USERS_E2E_EMAILS.profile,
        displayName: expect.any(String),
        status: 'active',
      });
    });

    it('อัปเดต displayName ได้ — 200 และ audit profile.update.self', async () => {
      const reg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(USERS_E2E_EMAILS.profile))
        .expect(HttpStatus.CREATED);

      const userId = reg.body.user.id as string;
      const token = reg.body.accessToken as string;

      const res = await createHttpServerRequest(app)
        .patch('/api/v1/app/users/me')
        .set(authBearerHeaders(token))
        .send({ displayName: 'ชื่อที่อัปเดตแล้ว' })
        .expect(HttpStatus.OK);

      expect(res.body.displayName).toBe('ชื่อที่อัปเดตแล้ว');

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: {
          action: USER_AUDIT_ACTIONS.PROFILE_UPDATE_SELF,
          actorUserId: userId,
          resourceId: userId,
        },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
    });

    it('ส่งฟิลด์ที่ไม่อนุญาต (whitelist) — 400 (ValidationPipe forbidNonWhitelisted)', async () => {
      const reg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(USERS_E2E_EMAILS.profile))
        .expect(HttpStatus.CREATED);

      const token = reg.body.accessToken as string;

      const res = await createHttpServerRequest(app)
        .patch('/api/v1/app/users/me')
        .set(authBearerHeaders(token))
        .send({
          displayName: 'OK',
          email: 'hijack@evil.test',
          status: 'suspended',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.statusCode).toBe(400);
      const msg = res.body.message;
      const text = Array.isArray(msg) ? msg.join(' ') : String(msg);
      expect(text).toMatch(/email|property|whitelist|should not exist|allowed/i);
    });

    it('ไม่มี Bearer — 401', async () => {
      await createHttpServerRequest(app).get('/api/v1/app/users/me').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PATCH /api/v1/app/users/:id (ผู้ดูแลแก้ผู้ใช้)', () => {
    it('system_admin อัปเดตผู้ใช้คนอื่นได้เมื่อมี user.update', async () => {
      const adminReg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(USERS_E2E_EMAILS.admin))
        .expect(HttpStatus.CREATED);
      await assignSystemAdminRole(dataSource, adminReg.body.user.id as string);
      const adminToken = adminReg.body.accessToken as string;

      const targetReg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(USERS_E2E_EMAILS.target))
        .expect(HttpStatus.CREATED);

      const targetId = targetReg.body.user.id as string;

      const res = await createHttpServerRequest(app)
        .patch(`/api/v1/app/users/${targetId}`)
        .set(authBearerHeaders(adminToken))
        .send({ displayName: 'แก้โดยแอดมิน' })
        .expect(HttpStatus.OK);

      expect(res.body.displayName).toBe('แก้โดยแอดมิน');
      expect(res.body.id).toBe(targetId);

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: {
          action: USER_AUDIT_ACTIONS.ADMIN_UPDATE,
          resourceId: targetId,
        },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
    });

    it('ผู้ใช้ทั่วไปแก้ผู้อื่น — 403 (ไม่มี user.update)', async () => {
      const normalToken = await registerAndLogin(USERS_E2E_EMAILS.normal);

      const other = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(USERS_E2E_EMAILS.target))
        .expect(HttpStatus.CREATED);

      const res = await createHttpServerRequest(app)
        .patch(`/api/v1/app/users/${other.body.user.id as string}`)
        .set(authBearerHeaders(normalToken))
        .send({ displayName: 'ไม่ควรสำเร็จ' })
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body.message).toBe('Insufficient permission');
    });
  });

  describe('Permission guard (สรุปพฤติกรรม)', () => {
    it('endpoint ที่ไม่มี @Permissions ใช้แค่ JWT — /users/me ไม่ต้องมี user.read', async () => {
      const token = await registerAndLogin(USERS_E2E_EMAILS.profile);
      await createHttpServerRequest(app).get('/api/v1/app/users/me').set(authBearerHeaders(token)).expect(HttpStatus.OK);
    });

    it('endpoint ที่มี @Permissions ต้องมีรหัสสิทธิ์ใน role — อ้างอิง SYSTEM_PERMISSION_CODES.USER_READ', async () => {
      expect(SYSTEM_PERMISSION_CODES.USER_READ).toBe('user.read');
      const token = await registerAndLogin(USERS_E2E_EMAILS.normal);
      await createHttpServerRequest(app)
        .get('/api/v1/app/users')
        .set(authBearerHeaders(token))
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
