import { createHash } from 'crypto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AuditLogEntity } from '../src/modules/audit/entities/audit-log.entity';
import { AUTH_AUDIT_ACTIONS } from '../src/modules/auth/constants/audit-actions';
import {
  authBearerHeaders,
  createCookieAgent,
  createHttpServerRequest,
  normalizeSetCookieHeader,
  parseRefreshTokenFromSetCookie,
} from './support/auth-test.helper';
import { cleanupAuthE2EFixtureUsers } from './support/auth-e2e-cleanup';
import {
  AUTH_E2E_DISPLAY_NAME,
  AUTH_E2E_FIXTURE_EMAILS,
  AUTH_E2E_PASSWORD,
  authE2ERegisterBody,
} from './support/auth-e2e.fixtures';
import { signExpiredRefreshToken } from './support/auth-e2e-jwt.helper';
import { createConfiguredTestApplication } from './support/test-app.factory';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let refreshCookieName: string;

  beforeAll(async () => {
    app = await createConfiguredTestApplication();
    dataSource = app.get<DataSource>(getDataSourceToken());
    refreshCookieName = process.env.AUTH_REFRESH_COOKIE_NAME ?? 'ccp_rt';
  });

  beforeEach(async () => {
    await cleanupAuthE2EFixtureUsers(dataSource);
  });

  afterAll(async () => {
    await cleanupAuthE2EFixtureUsers(dataSource);
    await app.close();
  });

  describe('POST /api/v1/app/auth/register', () => {
    it('ลงทะเบียนสำเร็จ — 201, access token, refresh cookie, audit register.success', async () => {
      const email = AUTH_E2E_FIXTURE_EMAILS.registerOk;
      const res = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(email))
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: expect.any(String),
        accessToken: expect.any(String),
        user: {
          email,
          displayName: expect.any(String),
          id: expect.any(String),
        },
      });

      const refresh = parseRefreshTokenFromSetCookie(
        normalizeSetCookieHeader(res.headers['set-cookie']),
        refreshCookieName,
      );
      expect(refresh).toBeDefined();
      expect(refresh!.split('.').length).toBe(3);

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: {
          action: AUTH_AUDIT_ACTIONS.REGISTER_SUCCESS,
          actorUserId: res.body.user.id,
        },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.resourceId).toBe(res.body.user.id);
      expect(audit!.afterData).toMatchObject({ email, displayName: AUTH_E2E_DISPLAY_NAME });
    });

    it('อีเมลซ้ำ — 401 และข้อความชัดเจน', async () => {
      const email = AUTH_E2E_FIXTURE_EMAILS.duplicate;
      const body = authE2ERegisterBody(email);

      await createHttpServerRequest(app).post('/api/v1/app/auth/register').send(body).expect(HttpStatus.CREATED);

      const dup = await createHttpServerRequest(app).post('/api/v1/app/auth/register').send(body).expect(HttpStatus.UNAUTHORIZED);

      expect(dup.body).toMatchObject({
        statusCode: 401,
        message: 'Email already in use',
      });
    });
  });

  describe('POST /api/v1/app/auth/login', () => {
    it('ล็อกอินสำเร็จ — 200, audit login.success', async () => {
      const email = AUTH_E2E_FIXTURE_EMAILS.loginOk;
      const reg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(email))
        .expect(HttpStatus.CREATED);

      const res = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/login')
        .send({ email, password: AUTH_E2E_PASSWORD })
        .expect(HttpStatus.OK);

      expect(res.body.user.id).toBe(reg.body.user.id);
      expect(res.body.accessToken).toBeDefined();

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: {
          action: AUTH_AUDIT_ACTIONS.LOGIN_SUCCESS,
          actorUserId: reg.body.user.id,
        },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.metadata).toMatchObject({ sessionId: expect.any(String) });
    });

    it('รหัสผิด — 401 และ audit login.failure (guest)', async () => {
      const email = AUTH_E2E_FIXTURE_EMAILS.loginOk;
      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(email))
        .expect(HttpStatus.CREATED);

      const repo = dataSource.getRepository(AuditLogEntity);
      const before = await repo.count({
        where: { action: AUTH_AUDIT_ACTIONS.LOGIN_FAILURE },
      });

      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/login')
        .send({ email, password: 'WrongPassword999!not-the-one' })
        .expect(HttpStatus.UNAUTHORIZED);

      const after = await repo.count({
        where: { action: AUTH_AUDIT_ACTIONS.LOGIN_FAILURE },
      });
      expect(after).toBe(before + 1);

      const latest = await repo.find({
        where: { action: AUTH_AUDIT_ACTIONS.LOGIN_FAILURE },
        order: { occurredAt: 'DESC' },
        take: 1,
      });
      expect(latest[0].actorType).toBe('guest');
      expect(latest[0].severity).toBe('warning');
      const emailHash = createHash('sha256').update(email.toLowerCase()).digest('hex');
      expect(latest[0].metadata).toMatchObject({
        failure_reason: 'credentials_mismatch',
        email_hash: emailHash,
      });
    });
  });

  describe('GET /api/v1/app/auth/me', () => {
    it('สำเร็จเมื่อมี Bearer ที่ถูกต้อง', async () => {
      const email = AUTH_E2E_FIXTURE_EMAILS.me;
      const { body } = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(email))
        .expect(HttpStatus.CREATED);

      const res = await createHttpServerRequest(app)
        .get('/api/v1/app/auth/me')
        .set(authBearerHeaders(body.accessToken))
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        id: body.user.id,
        email: body.user.email,
        displayName: body.user.displayName,
      });
    });

    it('ไม่มี / ผิด Authorization — 401', async () => {
      await createHttpServerRequest(app).get('/api/v1/app/auth/me').expect(HttpStatus.UNAUTHORIZED);

      await createHttpServerRequest(app)
        .get('/api/v1/app/auth/me')
        .set({ Authorization: 'Bearer clearly.not.valid.jwt.token' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/app/auth/refresh', () => {
    it('รีเฟรชสำเร็จ — cookie refresh + audit token.refresh', async () => {
      const email = AUTH_E2E_FIXTURE_EMAILS.refreshFlow;
      const agent = createCookieAgent(app);

      const reg = await agent
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(email))
        .expect(HttpStatus.CREATED);

      const userId = reg.body.user.id;
      const refresh = await agent.post('/api/v1/app/auth/refresh').expect(HttpStatus.OK);

      expect(refresh.body.accessToken).toBeDefined();
      expect(refresh.body.user.id).toBe(userId);

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: { action: AUTH_AUDIT_ACTIONS.TOKEN_REFRESH, actorUserId: userId },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.metadata).toMatchObject({
        previousSessionId: expect.any(String),
        newSessionId: expect.any(String),
      });
    });

    it('ไม่มี refresh cookie — 401', async () => {
      await createHttpServerRequest(app).post('/api/v1/app/auth/refresh').expect(HttpStatus.UNAUTHORIZED);
    });

    it('refresh token JWT ไม่ถูกต้อง — 401', async () => {
      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/refresh')
        .set('Cookie', [`${refreshCookieName}=not-a-valid-jwt`])
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('refresh token หมดอายุ — 401', async () => {
      const secret = process.env.AUTH_REFRESH_TOKEN_SECRET;
      if (!secret) {
        throw new Error('AUTH_REFRESH_TOKEN_SECRET ไม่ได้ตั้งใน .env.test');
      }
      const token = signExpiredRefreshToken(secret, {
        sub: '00000000-0000-4000-8000-000000000001',
        email: 'expired@example.test',
        sessionId: '00000000-0000-4000-8000-000000000002',
        type: 'refresh',
      });

      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/refresh')
        .set('Cookie', [`${refreshCookieName}=${token}`])
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('session ถูก revoke (หลัง logout) — 401', async () => {
      const email = AUTH_E2E_FIXTURE_EMAILS.logoutFlow;
      const reg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(email))
        .expect(HttpStatus.CREATED);

      const setCookie = normalizeSetCookieHeader(reg.headers['set-cookie']);
      const capturedRefresh = parseRefreshTokenFromSetCookie(setCookie, refreshCookieName);
      expect(capturedRefresh).toBeDefined();

      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/logout')
        .set(authBearerHeaders(reg.body.accessToken))
        .expect(HttpStatus.OK);

      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/refresh')
        .set('Cookie', [`${refreshCookieName}=${capturedRefresh}`])
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/app/auth/logout', () => {
    it('ออกจากระบบสำเร็จ, audit logout, access token ยังใช้ได้จนกว่า JWT จะหมดอายุ (ไม่มี revocation ฝั่ง access)', async () => {
      const email = AUTH_E2E_FIXTURE_EMAILS.logoutFlow;
      const reg = await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(email))
        .expect(HttpStatus.CREATED);

      const accessBefore = reg.body.accessToken as string;
      const userId = reg.body.user.id;

      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/logout')
        .set(authBearerHeaders(accessBefore))
        .expect(HttpStatus.OK);

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: { action: AUTH_AUDIT_ACTIONS.LOGOUT, actorUserId: userId },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.resourceType).toBe('auth_session');

      await createHttpServerRequest(app)
        .get('/api/v1/app/auth/me')
        .set(authBearerHeaders(accessBefore))
        .expect(HttpStatus.OK);
    });
  });
});
