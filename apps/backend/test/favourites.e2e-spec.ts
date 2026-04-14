import { HttpStatus, INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { authBearerHeaders, createHttpServerRequest } from './support/auth-test.helper';
import { authE2ERegisterBody } from './support/auth-e2e.fixtures';
import { cleanupFavouritesE2EFixtures } from './support/favourites-e2e-cleanup';
import { FAVOURITES_E2E_EMAILS, FAVOURITES_E2E_CODES } from './support/favourites-e2e.fixtures';
import { assignSystemAdminRole } from './support/rbac-e2e.helper';
import { createConfiguredTestApplication } from './support/test-app.factory';

describe('Favourites API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createConfiguredTestApplication();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  beforeEach(async () => {
    await cleanupFavouritesE2EFixtures(dataSource);
  });

  afterAll(async () => {
    await cleanupFavouritesE2EFixtures(dataSource);
    await app.close();
  });

  async function systemAdminToken(): Promise<string> {
    const res = await createHttpServerRequest(app)
      .post('/api/v1/app/auth/register')
      .send(authE2ERegisterBody(FAVOURITES_E2E_EMAILS.userB))
      .expect(HttpStatus.CREATED);
    await assignSystemAdminRole(dataSource, res.body.user.id as string);
    return res.body.accessToken as string;
  }

  async function registerFreshUserA(): Promise<string> {
    const res = await createHttpServerRequest(app)
      .post('/api/v1/app/auth/register')
      .send(authE2ERegisterBody(FAVOURITES_E2E_EMAILS.userA))
      .expect(HttpStatus.CREATED);
    return res.body.accessToken as string;
  }

  async function seedPublishedSong(
    adminTok: string,
    code: string,
    title: string,
  ): Promise<{ id: string }> {
    const res = await createHttpServerRequest(app)
      .post('/api/v1/app/admin/songs')
      .set(authBearerHeaders(adminTok))
      .send({
        title,
        code,
        chordproBody: `{title: ${title}}`,
        isPublished: true,
      })
      .expect(HttpStatus.CREATED);
    return { id: res.body.id as string };
  }

  it('ผู้ใช้ที่ login เพิ่มเพลงในรายการโปรดได้ — POST /favourites คืน 201 และรายการมีเพลงนั้น', async () => {
    const adminTok = await systemAdminToken();
    const { id: songId } = await seedPublishedSong(adminTok, FAVOURITES_E2E_CODES.songA, 'Fav A');

    const userATok = await registerFreshUserA();
    const add = await createHttpServerRequest(app)
      .post('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .send({ songId })
      .expect(HttpStatus.CREATED);

    expect(add.body.duplicate).toBe(false);
    expect(add.body.song.id).toBe(songId);

    const list = await createHttpServerRequest(app)
      .get('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .expect(HttpStatus.OK);

    expect(list.body.items.some((s: { id: string }) => s.id === songId)).toBe(true);
    expect(list.body.total).toBe(1);
  });

  it('ผู้ใช้ที่ login ลบรายการโปรดได้ — DELETE /favourites/:songId แล้วรายการว่าง', async () => {
    const adminTok = await systemAdminToken();
    const { id: songId } = await seedPublishedSong(adminTok, FAVOURITES_E2E_CODES.songA, 'Fav A');

    const userATok = await registerFreshUserA();
    await createHttpServerRequest(app)
      .post('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .send({ songId })
      .expect(HttpStatus.CREATED);

    await createHttpServerRequest(app)
      .delete(`/api/v1/app/favourites/${songId}`)
      .set(authBearerHeaders(userATok))
      .expect(HttpStatus.NO_CONTENT);

    const list = await createHttpServerRequest(app)
      .get('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .expect(HttpStatus.OK);

    expect(list.body.items).toEqual([]);
    expect(list.body.total).toBe(0);
  });

  it('GET /favourites คืนเฉพาะรายการของผู้ใช้และเรียงลำดับถูกต้อง (หลายเพลง)', async () => {
    const adminTok = await systemAdminToken();
    const { id: idA } = await seedPublishedSong(adminTok, FAVOURITES_E2E_CODES.songA, 'Fav A');
    const { id: idB } = await seedPublishedSong(adminTok, FAVOURITES_E2E_CODES.songB, 'Fav B');

    const userATok = await registerFreshUserA();

    await createHttpServerRequest(app)
      .post('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .send({ songId: idA })
      .expect(HttpStatus.CREATED);

    await createHttpServerRequest(app)
      .post('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .send({ songId: idB })
      .expect(HttpStatus.CREATED);

    const list = await createHttpServerRequest(app)
      .get('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .expect(HttpStatus.OK);

    expect(list.body.total).toBe(2);
    const ids = list.body.items.map((s: { id: string }) => s.id);
    expect(ids).toContain(idA);
    expect(ids).toContain(idB);
    expect(ids[0]).toBe(idB);

    const otherReg = await createHttpServerRequest(app)
      .post('/api/v1/app/auth/register')
      .send(authE2ERegisterBody(FAVOURITES_E2E_EMAILS.other))
      .expect(HttpStatus.CREATED);

    const otherList = await createHttpServerRequest(app)
      .get('/api/v1/app/favourites')
      .set(authBearerHeaders(otherReg.body.accessToken as string))
      .expect(HttpStatus.OK);

    expect(otherList.body.total).toBe(0);
  });

  it('เพิ่มโปรดซ้ำ — ได้ 200 duplicate: true และใน DB มีแถวเดียว', async () => {
    const adminTok = await systemAdminToken();
    const { id: songId } = await seedPublishedSong(adminTok, FAVOURITES_E2E_CODES.songA, 'Fav A');
    const userATok = await registerFreshUserA();

    await createHttpServerRequest(app)
      .post('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .send({ songId })
      .expect(HttpStatus.CREATED);

    const second = await createHttpServerRequest(app)
      .post('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .send({ songId })
      .expect(HttpStatus.OK);

    expect(second.body.duplicate).toBe(true);
    expect(second.body.song.id).toBe(songId);

    const list = await createHttpServerRequest(app)
      .get('/api/v1/app/favourites')
      .set(authBearerHeaders(userATok))
      .expect(HttpStatus.OK);

    expect(list.body.total).toBe(1);

    const schema = process.env.DB_SCHEMA ?? 'public';
    const me = await createHttpServerRequest(app)
      .get('/api/v1/app/users/me')
      .set(authBearerHeaders(userATok))
      .expect(HttpStatus.OK);
    const uid = me.body.id as string;
    const rows = await dataSource.query(
      `SELECT COUNT(*)::int AS c FROM "${schema}"."user_song_favorites" WHERE user_id = $1 AND song_id = $2`,
      [uid, songId],
    );
    expect(rows[0].c).toBe(1);
  });

  it('guest เรียกจัดการ favourites ไม่ได้ — 401', async () => {
    await createHttpServerRequest(app).get('/api/v1/app/favourites').expect(HttpStatus.UNAUTHORIZED);

    await createHttpServerRequest(app)
      .post('/api/v1/app/favourites')
      .send({ songId: '00000000-0000-4000-8000-000000000001' })
      .expect(HttpStatus.UNAUTHORIZED);

    await createHttpServerRequest(app)
      .delete('/api/v1/app/favourites/00000000-0000-4000-8000-000000000001')
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
