import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CHURCH_ID_HEADER, SYSTEM_ROLE_CODES } from '../src/modules/rbac/rbac.constants';
import { authBearerHeaders, createHttpServerRequest } from './support/auth-test.helper';
import { authE2ERegisterBody } from './support/auth-e2e.fixtures';
import { assignSystemAdminRole } from './support/rbac-e2e.helper';
import { cleanupSongsE2EFixtures } from './support/songs-e2e-cleanup';
import {
  SONGS_E2E_CHORDPRO,
  SONGS_E2E_CHURCH_SLUG,
  SONGS_E2E_EMAILS,
  SONGS_E2E_SLUGS,
} from './support/songs-e2e.fixtures';
import { createConfiguredTestApplication } from './support/test-app.factory';

describe('Songs API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createConfiguredTestApplication();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await cleanupSongsE2EFixtures(dataSource);
  });

  afterAll(async () => {
    await cleanupSongsE2EFixtures(dataSource);
    await app.close();
  });

  async function registerToken(email: string): Promise<string> {
    const res = await createHttpServerRequest(app)
      .post('/api/v1/app/auth/register')
      .send(authE2ERegisterBody(email))
      .expect(HttpStatus.CREATED);
    return res.body.accessToken as string;
  }

  async function systemAdminToken(): Promise<string> {
    const res = await createHttpServerRequest(app)
      .post('/api/v1/app/auth/register')
      .send(authE2ERegisterBody(SONGS_E2E_EMAILS.admin))
      .expect(HttpStatus.CREATED);
    await assignSystemAdminRole(dataSource, res.body.user.id as string);
    return res.body.accessToken as string;
  }

  async function createSongsChapel(ownerToken: string): Promise<string> {
    const res = await createHttpServerRequest(app)
      .post('/api/v1/app/churches')
      .set(authBearerHeaders(ownerToken))
      .send({ name: 'SE2E Songs Chapel', slug: SONGS_E2E_CHURCH_SLUG })
      .expect(HttpStatus.CREATED);
    return res.body.id as string;
  }

  async function worshipCategoryId(): Promise<string> {
    const res = await createHttpServerRequest(app).get('/api/v1/app/songs/categories').expect(HttpStatus.OK);
    const worship = (res.body as { id: string; slug: string }[]).find((c) => c.slug === 'worship');
    if (!worship) {
      throw new Error('migration ต้องมี song category slug worship');
    }
    return worship.id;
  }

  describe('Guest / public', () => {
    it('guest ดูรายการเพลงที่เผยแพร่ได้ — GET /songs ไม่ต้องมี JWT', async () => {
      const adminTok = await systemAdminToken();
      await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(adminTok))
        .send({
          title: 'SE2E เพลงสาธารณะ',
          slug: SONGS_E2E_SLUGS.globalPublished,
          chordproBody: SONGS_E2E_CHORDPRO,
          isPublished: true,
        })
        .expect(HttpStatus.CREATED);

      const list = await createHttpServerRequest(app).get('/api/v1/app/songs').expect(HttpStatus.OK);
      expect(list.body.items.some((s: { slug: string }) => s.slug === SONGS_E2E_SLUGS.globalPublished)).toBe(true);
    });

    it('guest อ่านรายละเอียดเพลงที่เผยแพร่ได้ — chordpro อยู่ใน body', async () => {
      const adminTok = await systemAdminToken();
      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(adminTok))
        .send({
          title: 'SE2E Detail',
          slug: SONGS_E2E_SLUGS.globalPublished,
          chordproBody: SONGS_E2E_CHORDPRO,
          isPublished: true,
        })
        .expect(HttpStatus.CREATED);

      const id = created.body.id as string;
      const detail = await createHttpServerRequest(app).get(`/api/v1/app/songs/${id}`).expect(HttpStatus.OK);
      expect(detail.body.chordproBody).toBe(SONGS_E2E_CHORDPRO);
      expect(detail.body.isPublished).toBe(true);
    });

    it('guest เห็นเพลง unpublished ไม่ได้ — list ไม่รวม และ GET detail 404', async () => {
      const adminTok = await systemAdminToken();
      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(adminTok))
        .send({
          title: 'SE2E Draft Only',
          slug: SONGS_E2E_SLUGS.globalDraft,
          chordproBody: '{title: x}',
          isPublished: false,
        })
        .expect(HttpStatus.CREATED);

      const id = created.body.id as string;
      const list = await createHttpServerRequest(app).get('/api/v1/app/songs').query({ q: 'Draft Only' }).expect(HttpStatus.OK);
      expect(list.body.items.some((s: { id: string }) => s.id === id)).toBe(false);

      await createHttpServerRequest(app).get(`/api/v1/app/songs/${id}`).expect(HttpStatus.NOT_FOUND);
    });

    it('guest สร้างเพลงไม่ได้ — 401', async () => {
      await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .send({
          title: 'x',
          chordproBody: 'x',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('ผู้ใช้ที่ login แล้ว + ขอบเขตคริสตจักร', () => {
    it('เจ้าของคริสตจักรสร้างเพลงได้ — ต้องส่ง x-church-id และมีสิทธิ์ song.create แบบ church-scoped', async () => {
      const ownerTok = await registerToken(SONGS_E2E_EMAILS.owner);
      const churchId = await createSongsChapel(ownerTok);

      const res = await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(ownerTok))
        .set(CHURCH_ID_HEADER, churchId)
        .send({
          title: 'SE2E Church Song',
          slug: SONGS_E2E_SLUGS.churchSong,
          chordproBody: SONGS_E2E_CHORDPRO,
          isPublished: true,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.churchId).toBe(churchId);
    });

    it('ผู้ใช้มี JWT แต่ไม่มีสิทธิ์สร้างเพลง (ไม่มี church header) — 403', async () => {
      const tok = await registerToken(SONGS_E2E_EMAILS.owner);
      await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(tok))
        .send({
          title: 'ไม่ควรสำเร็จ',
          slug: SONGS_E2E_SLUGS.churchSong,
          chordproBody: 'x',
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('เจ้าของคริสตจักรอัปเดตเพลงใน scope ได้ — implementation ใช้ RBAC ตาม churchId ไม่ได้เช็ค createdBy อย่างเดียว', async () => {
      const ownerTok = await registerToken(SONGS_E2E_EMAILS.owner);
      const churchId = await createSongsChapel(ownerTok);
      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(ownerTok))
        .set(CHURCH_ID_HEADER, churchId)
        .send({
          title: 'ก่อนแก้',
          slug: SONGS_E2E_SLUGS.churchEdit,
          chordproBody: '{title: old}',
          isPublished: true,
        })
        .expect(HttpStatus.CREATED);

      const updated = await createHttpServerRequest(app)
        .patch(`/api/v1/app/songs/${created.body.id as string}`)
        .set(authBearerHeaders(ownerTok))
        .set(CHURCH_ID_HEADER, churchId)
        .send({ title: 'หลังแก้', chordproBody: '{title: new}' })
        .expect(HttpStatus.OK);

      expect(updated.body.title).toBe('หลังแก้');
      expect(updated.body.chordproBody).toBe('{title: new}');
    });

    it('สมาชิกที่ไม่มี song.update แก้เพลงใน church ไม่ได้ — 403 จาก PermissionsGuard', async () => {
      const ownerTok = await registerToken(SONGS_E2E_EMAILS.owner);
      const memberTok = await registerToken(SONGS_E2E_EMAILS.member);
      const churchId = await createSongsChapel(ownerTok);

      const memberMe = await createHttpServerRequest(app)
        .get('/api/v1/app/users/me')
        .set(authBearerHeaders(memberTok))
        .expect(HttpStatus.OK);

      await createHttpServerRequest(app)
        .post(`/api/v1/app/churches/${churchId}/members`)
        .set(authBearerHeaders(ownerTok))
        .send({ userId: memberMe.body.id as string, roleCode: SYSTEM_ROLE_CODES.MEMBER })
        .expect(HttpStatus.CREATED);

      const song = await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(ownerTok))
        .set(CHURCH_ID_HEADER, churchId)
        .send({
          title: 'ของคริสตจักร',
          slug: SONGS_E2E_SLUGS.churchEdit,
          chordproBody: 'x',
          isPublished: true,
        })
        .expect(HttpStatus.CREATED);

      const res = await createHttpServerRequest(app)
        .patch(`/api/v1/app/songs/${song.body.id as string}`)
        .set(authBearerHeaders(memberTok))
        .set(CHURCH_ID_HEADER, churchId)
        .send({ title: 'member แก้' })
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body.message).toBe('Insufficient permission');
    });
  });

  describe('ค้นหา / filter', () => {
    it('q (title ILIKE), categorySlug, tagSlugs และ churchId — ทำงานกับ listPublic', async () => {
      const adminTok = await systemAdminToken();
      const ownerTok = await registerToken(SONGS_E2E_EMAILS.owner);
      const churchId = await createSongsChapel(ownerTok);
      const catId = await worshipCategoryId();

      await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(adminTok))
        .send({
          title: 'SE2E filter unique title XYZ 123',
          slug: SONGS_E2E_SLUGS.filterUnique,
          chordproBody: 'x',
          isPublished: true,
          categoryId: catId,
          tagSlugs: ['se2e-filter-tag'],
        })
        .expect(HttpStatus.CREATED);

      const byQ = await createHttpServerRequest(app)
        .get('/api/v1/app/songs')
        .query({ q: 'filter unique title XYZ' })
        .expect(HttpStatus.OK);
      expect(byQ.body.items.some((s: { slug: string }) => s.slug === SONGS_E2E_SLUGS.filterUnique)).toBe(true);

      const byCat = await createHttpServerRequest(app)
        .get('/api/v1/app/songs')
        .query({ categorySlug: 'worship' })
        .expect(HttpStatus.OK);
      expect(byCat.body.items.some((s: { slug: string }) => s.slug === SONGS_E2E_SLUGS.filterUnique)).toBe(true);

      const byTag = await createHttpServerRequest(app)
        .get('/api/v1/app/songs')
        .query({ tagSlugs: 'se2e-filter-tag' })
        .expect(HttpStatus.OK);
      expect(byTag.body.items.some((s: { slug: string }) => s.slug === SONGS_E2E_SLUGS.filterUnique)).toBe(true);

      await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(ownerTok))
        .set(CHURCH_ID_HEADER, churchId)
        .send({
          title: 'ในคริสตจักรเท่านั้น',
          slug: 'se2e-only-chapel',
          chordproBody: 'x',
          isPublished: true,
        })
        .expect(HttpStatus.CREATED);

      const byChurch = await createHttpServerRequest(app)
        .get('/api/v1/app/songs')
        .query({ churchId })
        .expect(HttpStatus.OK);
      expect(byChurch.body.items.every((s: { churchId: string | null }) => s.churchId === churchId)).toBe(true);
    });
  });

  describe('หมวดหมู่ / แท็ก (ความสัมพันธ์)', () => {
    it('บันทึก categoryId และ tagSlugs — GET detail แสดง category + tags', async () => {
      const adminTok = await systemAdminToken();
      const catId = await worshipCategoryId();

      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(adminTok))
        .send({
          title: 'SE2E Meta',
          slug: SONGS_E2E_SLUGS.metaSong,
          chordproBody: SONGS_E2E_CHORDPRO,
          isPublished: true,
          categoryId: catId,
          tagSlugs: ['se2e-rel-tag-a', 'se2e-rel-tag-b'],
        })
        .expect(HttpStatus.CREATED);

      const id = created.body.id as string;
      const detail = await createHttpServerRequest(app).get(`/api/v1/app/songs/${id}`).expect(HttpStatus.OK);

      expect(detail.body.category?.slug).toBe('worship');
      const tagSlugs = (detail.body.tags as { slug: string }[]).map((t) => t.slug).sort();
      expect(tagSlugs).toEqual(['se2e-rel-tag-a', 'se2e-rel-tag-b'].sort());
    });
  });

  describe('ลบอ่อน (soft delete)', () => {
    it('ผู้มีสิทธิ์ song.delete ลบแล้ว public ไม่เห็น — GET 404', async () => {
      const ownerTok = await registerToken(SONGS_E2E_EMAILS.owner);
      const churchId = await createSongsChapel(ownerTok);

      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(ownerTok))
        .set(CHURCH_ID_HEADER, churchId)
        .send({
          title: 'จะถูกลบ',
          slug: SONGS_E2E_SLUGS.toDelete,
          chordproBody: 'x',
          isPublished: true,
        })
        .expect(HttpStatus.CREATED);

      const id = created.body.id as string;
      await createHttpServerRequest(app).get(`/api/v1/app/songs/${id}`).expect(HttpStatus.OK);

      await createHttpServerRequest(app)
        .delete(`/api/v1/app/songs/${id}`)
        .set(authBearerHeaders(ownerTok))
        .set(CHURCH_ID_HEADER, churchId)
        .expect(HttpStatus.NO_CONTENT);

      await createHttpServerRequest(app).get(`/api/v1/app/songs/${id}`).expect(HttpStatus.NOT_FOUND);

      const list = await createHttpServerRequest(app).get('/api/v1/app/songs').query({ q: 'จะถูกลบ' }).expect(HttpStatus.OK);
      expect(list.body.items.some((s: { id: string }) => s.id === id)).toBe(false);
    });
  });

  describe('view count', () => {
    it('แต่ละครั้งที่ guest เปิด GET /songs/:id จะ increment viewCount (ค่าในตอบสนอง)', async () => {
      const adminTok = await systemAdminToken();
      const created = await createHttpServerRequest(app)
        .post('/api/v1/app/songs')
        .set(authBearerHeaders(adminTok))
        .send({
          title: 'SE2E View',
          slug: SONGS_E2E_SLUGS.viewCount,
          chordproBody: 'x',
          isPublished: true,
        })
        .expect(HttpStatus.CREATED);

      const id = created.body.id as string;
      const first = await createHttpServerRequest(app).get(`/api/v1/app/songs/${id}`).expect(HttpStatus.OK);
      expect(first.body.viewCount).toBe(1);

      const second = await createHttpServerRequest(app).get(`/api/v1/app/songs/${id}`).expect(HttpStatus.OK);
      expect(second.body.viewCount).toBe(2);
    });
  });
});
