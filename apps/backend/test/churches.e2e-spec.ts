import { HttpStatus, INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AuditLogEntity } from '../src/modules/audit/entities/audit-log.entity';
import { CHURCH_AUDIT_ACTIONS } from '../src/modules/churches/constants/audit-actions';
import { CHURCH_ROLE_CODES } from '../src/modules/rbac/rbac.constants';
import { authBearerHeaders, createHttpServerRequest } from './support/auth-test.helper';
import { authE2ERegisterBody } from './support/auth-e2e.fixtures';
import { cleanupChurchesE2EFixtures } from './support/churches-e2e-cleanup';
import {
  CHURCHES_E2E_EMAILS,
  CHURCHES_E2E_CODES,
} from './support/churches-e2e.fixtures';
import { assignSystemAdminRole } from './support/rbac-e2e.helper';
import { createConfiguredTestApplication } from './support/test-app.factory';

describe('Churches API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createConfiguredTestApplication();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  beforeEach(async () => {
    await cleanupChurchesE2EFixtures(dataSource);
  });

  afterAll(async () => {
    await cleanupChurchesE2EFixtures(dataSource);
    await app.close();
  });

  async function registerAccessToken(email: string): Promise<string> {
    const res = await createHttpServerRequest(app)
      .post('/api/v1/app/auth/register')
      .send(authE2ERegisterBody(email))
      .expect(HttpStatus.CREATED);
    return res.body.accessToken as string;
  }

  describe('การสร้างคริสตจักร', () => {
    it('ผู้ใช้ที่ลงทะเบียนแล้วสร้างคริสตจักรได้ — มีสิทธิ์ church.create บน role user (global/personal)', async () => {
      const token = await registerAccessToken(CHURCHES_E2E_EMAILS.owner);

      const res = await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(token))
        .send({
          name: 'CE2E คริสตจักรทดสอบ',
          code: CHURCHES_E2E_CODES.alpha,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: 'CE2E คริสตจักรทดสอบ',
        code: CHURCHES_E2E_CODES.alpha,
      });

      const mine = await createHttpServerRequest(app)
        .get('/api/v1/app/churches')
        .set(authBearerHeaders(token))
        .expect(HttpStatus.OK);

      expect(Array.isArray(mine.body)).toBe(true);
      expect(mine.body.some((c: { code: string }) => c.code === CHURCHES_E2E_CODES.alpha)).toBe(true);

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: {
          action: CHURCH_AUDIT_ACTIONS.RECORD_CREATE,
          resourceId: res.body.id,
        },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
    });

    it('ผู้ใช้คนเดียวสร้างหลายคริสตจักรได้ — code ไม่ซ้ำ', async () => {
      const token = await registerAccessToken(CHURCHES_E2E_EMAILS.owner);

      await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(token))
        .send({ name: 'CE2E แรก', code: CHURCHES_E2E_CODES.alpha })
        .expect(HttpStatus.CREATED);

      await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(token))
        .send({ name: 'CE2E สอง', code: CHURCHES_E2E_CODES.beta })
        .expect(HttpStatus.CREATED);

      const mine = await createHttpServerRequest(app)
        .get('/api/v1/app/churches')
        .set(authBearerHeaders(token))
        .expect(HttpStatus.OK);

      expect(mine.body.length).toBeGreaterThanOrEqual(2);
      const codes = mine.body.map((c: { code: string }) => c.code);
      expect(codes).toEqual(expect.arrayContaining([CHURCHES_E2E_CODES.alpha, CHURCHES_E2E_CODES.beta]));
    });

    it('ไม่มี JWT — 401', async () => {
      await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .send({ name: 'ไม่ควรสร้าง', code: CHURCHES_E2E_CODES.alpha })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('เจ้าของ / สมาชิก / ผู้ไม่มีส่วนเกี่ยวข้อง', () => {
    it('church_admin (ผู้สร้างคริสตจักร) อัปเดตคริสตจักรของตัวเองได้ — church.update แบบ church-scoped', async () => {
      const ownerToken = await registerAccessToken(CHURCHES_E2E_EMAILS.owner);
      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(ownerToken))
        .send({ name: 'ชื่อเดิม', code: CHURCHES_E2E_CODES.alpha })
        .expect(HttpStatus.CREATED);

      const id = created.body.id as string;

      const updated = await createHttpServerRequest(app)
        .patch(`/api/v1/app/churches/${id}`)
        .set(authBearerHeaders(ownerToken))
        .send({ name: 'ชื่อใหม่หลังแก้' })
        .expect(HttpStatus.OK);

      expect(updated.body.name).toBe('ชื่อใหม่หลังแก้');

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: { action: CHURCH_AUDIT_ACTIONS.RECORD_UPDATE, resourceId: id },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
    });

    it('ผู้ที่ไม่ใช่สมาชิกไม่สามารถอัปเดตคริสตจักรคนอื่น — 404 (การออกแบบปิดบังสิทธิ์ไว้ใน assertChurchPermission)', async () => {
      const ownerToken = await registerAccessToken(CHURCHES_E2E_EMAILS.owner);
      const strangerToken = await registerAccessToken(CHURCHES_E2E_EMAILS.stranger);

      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(ownerToken))
        .send({ name: 'ของเจ้าของ', code: CHURCHES_E2E_CODES.alpha })
        .expect(HttpStatus.CREATED);

      const res = await createHttpServerRequest(app)
        .patch(`/api/v1/app/churches/${created.body.id as string}`)
        .set(authBearerHeaders(strangerToken))
        .send({ name: 'แทรกแซง' })
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body.message).toBe('Church not found');
    });

    it('กฎสมาชิก: church_admin อ่าน/ดูสมาชิกได้ — member ไม่มี church.read จึง get รายละเอียดคริสตจักรไม่ได้ (404)', async () => {
      const ownerToken = await registerAccessToken(CHURCHES_E2E_EMAILS.owner);
      const adminUserToken = await registerAccessToken(CHURCHES_E2E_EMAILS.churchAdminJoiner);
      const memberUserToken = await registerAccessToken(CHURCHES_E2E_EMAILS.plainMember);

      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(ownerToken))
        .send({ name: 'CE2E Access', code: CHURCHES_E2E_CODES.accessAlpha })
        .expect(HttpStatus.CREATED);

      const churchId = created.body.id as string;
      const adminJoinerId = (await createHttpServerRequest(app)
        .get('/api/v1/app/users/me')
        .set(authBearerHeaders(adminUserToken))
        .expect(HttpStatus.OK)).body.id as string;
      const plainMemberId = (await createHttpServerRequest(app)
        .get('/api/v1/app/users/me')
        .set(authBearerHeaders(memberUserToken))
        .expect(HttpStatus.OK)).body.id as string;

      await createHttpServerRequest(app)
        .post(`/api/v1/app/churches/${churchId}/members`)
        .set(authBearerHeaders(ownerToken))
        .send({ userId: adminJoinerId, roleCode: CHURCH_ROLE_CODES.CHURCH_ADMIN })
        .expect(HttpStatus.CREATED);

      await createHttpServerRequest(app)
        .post(`/api/v1/app/churches/${churchId}/members`)
        .set(authBearerHeaders(ownerToken))
        .send({ userId: plainMemberId, roleCode: CHURCH_ROLE_CODES.MEMBER })
        .expect(HttpStatus.CREATED);

      await createHttpServerRequest(app)
        .get(`/api/v1/app/churches/${churchId}`)
        .set(authBearerHeaders(adminUserToken))
        .expect(HttpStatus.OK);

      const members = await createHttpServerRequest(app)
        .get(`/api/v1/app/churches/${churchId}/members`)
        .set(authBearerHeaders(adminUserToken))
        .expect(HttpStatus.OK);

      expect(Array.isArray(members.body)).toBe(true);
      expect(members.body.length).toBeGreaterThanOrEqual(3);

      await createHttpServerRequest(app)
        .get(`/api/v1/app/churches/${churchId}`)
        .set(authBearerHeaders(memberUserToken))
        .expect(HttpStatus.NOT_FOUND);

      const mineMember = await createHttpServerRequest(app)
        .get('/api/v1/app/churches')
        .set(authBearerHeaders(memberUserToken))
        .expect(HttpStatus.OK);

      expect(mineMember.body.some((c: { id: string }) => c.id === churchId)).toBe(true);
    });
  });

  describe('บทบาท church-scoped กับ permission ที่ต่างกัน', () => {
    it('system_admin override ได้แม้ไม่เป็นสมาชิกคริสตจักร', async () => {
      const ownerToken = await registerAccessToken(CHURCHES_E2E_EMAILS.owner);
      const adminToken = await registerAccessToken(CHURCHES_E2E_EMAILS.stranger);
      const adminMe = await createHttpServerRequest(app)
        .get('/api/v1/app/users/me')
        .set(authBearerHeaders(adminToken))
        .expect(HttpStatus.OK);
      await assignSystemAdminRole(dataSource, adminMe.body.id as string);

      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(ownerToken))
        .send({ name: 'CE2E override', code: CHURCHES_E2E_CODES.deleteDemo })
        .expect(HttpStatus.CREATED);

      await createHttpServerRequest(app)
        .patch(`/api/v1/app/churches/${created.body.id as string}`)
        .set(authBearerHeaders(adminToken))
        .send({ name: 'override by system admin' })
        .expect(HttpStatus.OK);
    });

    it('church_admin ที่ถูกมอบสิทธิ์สามารถลบคริสตจักรได้', async () => {
      const ownerToken = await registerAccessToken(CHURCHES_E2E_EMAILS.owner);
      const adminToken = await registerAccessToken(CHURCHES_E2E_EMAILS.churchAdminJoiner);

      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(ownerToken))
        .send({ name: 'CE2E ลบ', code: CHURCHES_E2E_CODES.deleteDemo })
        .expect(HttpStatus.CREATED);

      const churchId = created.body.id as string;
      const adminId = (await createHttpServerRequest(app)
        .get('/api/v1/app/users/me')
        .set(authBearerHeaders(adminToken))
        .expect(HttpStatus.OK)).body.id as string;

      await createHttpServerRequest(app)
        .post(`/api/v1/app/churches/${churchId}/members`)
        .set(authBearerHeaders(ownerToken))
        .send({ userId: adminId, roleCode: CHURCH_ROLE_CODES.CHURCH_ADMIN })
        .expect(HttpStatus.CREATED);

      await createHttpServerRequest(app)
        .delete(`/api/v1/app/churches/${churchId}`)
        .set(authBearerHeaders(adminToken))
        .expect(HttpStatus.NO_CONTENT);
    });

    it('church_admin (ผู้สร้างคริสตจักร) ลบ (soft delete) ได้ — role มี church.delete', async () => {
      const ownerToken = await registerAccessToken(CHURCHES_E2E_EMAILS.owner);

      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(ownerToken))
        .send({ name: 'CE2E จะถูกลบ', code: CHURCHES_E2E_CODES.deleteDemo })
        .expect(HttpStatus.CREATED);

      const churchId = created.body.id as string;

      await createHttpServerRequest(app)
        .delete(`/api/v1/app/churches/${churchId}`)
        .set(authBearerHeaders(ownerToken))
        .expect(HttpStatus.NO_CONTENT);

      await createHttpServerRequest(app)
        .get(`/api/v1/app/churches/${churchId}`)
        .set(authBearerHeaders(ownerToken))
        .expect(HttpStatus.NOT_FOUND);

      const mine = await createHttpServerRequest(app)
        .get('/api/v1/app/churches')
        .set(authBearerHeaders(ownerToken))
        .expect(HttpStatus.OK);

      expect(mine.body.some((c: { id: string }) => c.id === churchId)).toBe(false);

      const audit = await dataSource.getRepository(AuditLogEntity).findOne({
        where: { action: CHURCH_AUDIT_ACTIONS.RECORD_DELETE, resourceId: churchId },
        order: { occurredAt: 'DESC' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.afterData).toMatchObject({ deleted: true });

      await createHttpServerRequest(app)
        .post('/api/v1/app/churches')
        .set(authBearerHeaders(ownerToken))
        .send({ name: 'ใหม่หลังลบ', code: CHURCHES_E2E_CODES.afterDelete })
        .expect(HttpStatus.CREATED);
    });
  });
});
