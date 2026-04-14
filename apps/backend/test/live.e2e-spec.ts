import { HttpStatus, INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CHURCH_ID_HEADER, CHURCH_ROLE_CODES } from '../src/modules/rbac/rbac.constants';
import { authBearerHeaders, createHttpServerRequest } from './support/auth-test.helper';
import { authE2ERegisterBody } from './support/auth-e2e.fixtures';
import {
  LIVE_CLIENT_EVENTS,
  LIVE_ROOM_PREFIX,
  LIVE_SERVER_EVENTS,
  liveSessionRoom,
} from './support/live-event-contract';
import { cleanupLiveE2EFixtures } from './support/live-e2e-cleanup';
import {
  LIVE_E2E_CHURCH_CODE,
  LIVE_E2E_EMAILS,
  LIVE_E2E_SESSION_TITLE,
  LIVE_E2E_SONG_CODES,
} from './support/live-e2e.fixtures';
import {
  connectLiveSocket,
  expectNoSocketEvent,
  joinLiveSession,
  onceSocketEvent,
  waitForSocketConnect,
} from './support/live-ws.helper';
import { waitForLiveSyncSongIndex } from './support/live-rest-sync.helper';
import { createListeningTestApplication } from './support/test-app.factory';

describe('Live module — REST + WebSocket (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    const ctx = await createListeningTestApplication();
    app = ctx.app;
    baseUrl = ctx.baseUrl;
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  beforeEach(async () => {
    await cleanupLiveE2EFixtures(dataSource);
  });

  afterAll(async () => {
    await cleanupLiveE2EFixtures(dataSource);
    await app.close();
  });

  type LiveSeed = {
    ownerToken: string;
    memberToken: string;
    outsiderToken: string;
    churchId: string;
    sessionId: string;
    songIdA: string;
    songIdB: string;
  };

  async function seedChurchLiveSession(): Promise<LiveSeed> {
    const ownerToken = (
      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(LIVE_E2E_EMAILS.owner))
        .expect(HttpStatus.CREATED)
    ).body.accessToken as string;

    const churchRes = await createHttpServerRequest(app)
      .post('/api/v1/app/churches')
      .set(authBearerHeaders(ownerToken))
      .send({ name: 'LE2E Chapel', code: LIVE_E2E_CHURCH_CODE })
      .expect(HttpStatus.CREATED);
    const churchId = churchRes.body.id as string;

    const memberReg = await createHttpServerRequest(app)
      .post('/api/v1/app/auth/register')
      .send(authE2ERegisterBody(LIVE_E2E_EMAILS.member))
      .expect(HttpStatus.CREATED);
    const memberToken = memberReg.body.accessToken as string;

    const outsiderToken = (
      await createHttpServerRequest(app)
        .post('/api/v1/app/auth/register')
        .send(authE2ERegisterBody(LIVE_E2E_EMAILS.outsider))
        .expect(HttpStatus.CREATED)
    ).body.accessToken as string;

    const memberMe = await createHttpServerRequest(app)
      .get('/api/v1/app/users/me')
      .set(authBearerHeaders(memberToken))
      .expect(HttpStatus.OK);

    await createHttpServerRequest(app)
      .post(`/api/v1/app/churches/${churchId}/members`)
      .set(authBearerHeaders(ownerToken))
      .send({ userId: memberMe.body.id as string, roleCode: CHURCH_ROLE_CODES.MEMBER })
      .expect(HttpStatus.CREATED);

    const songA = await createHttpServerRequest(app)
      .post('/api/v1/app/admin/songs')
      .set(authBearerHeaders(ownerToken))
      .set(CHURCH_ID_HEADER, churchId)
      .send({
        title: 'LE2E A',
        code: LIVE_E2E_SONG_CODES.a,
        chordproBody: '{title: A}',
        isPublished: true,
      })
      .expect(HttpStatus.CREATED);

    const songB = await createHttpServerRequest(app)
      .post('/api/v1/app/admin/songs')
      .set(authBearerHeaders(ownerToken))
      .set(CHURCH_ID_HEADER, churchId)
      .send({
        title: 'LE2E B',
        code: LIVE_E2E_SONG_CODES.b,
        chordproBody: '{title: B}',
        isPublished: true,
      })
      .expect(HttpStatus.CREATED);

    const liveRes = await createHttpServerRequest(app)
      .post('/api/v1/app/live/sessions')
      .set(authBearerHeaders(ownerToken))
      .set(CHURCH_ID_HEADER, churchId)
      .send({ title: LIVE_E2E_SESSION_TITLE })
      .expect(HttpStatus.CREATED);

    return {
      ownerToken,
      memberToken,
      outsiderToken,
      churchId,
      sessionId: liveRes.body.id as string,
      songIdA: songA.body.id as string,
      songIdB: songB.body.id as string,
    };
  }

  it('1) สร้าง live session ผ่าน REST — leader = ผู้สร้าง, churchId ตรงกับ header', async () => {
    const s = await seedChurchLiveSession();
    const ownerMe = await createHttpServerRequest(app)
      .get('/api/v1/app/users/me')
      .set(authBearerHeaders(s.ownerToken))
      .expect(HttpStatus.OK);
    const schema = process.env.DB_SCHEMA ?? 'public';

    expect(s.sessionId).toMatch(/^[0-9a-f-]{36}$/i);
    const row = await dataSource.query(
      `SELECT leader_user_id, church_id, title, status FROM "${schema}"."live_sessions" WHERE id = $1`,
      [s.sessionId],
    );
    expect(row[0].leader_user_id).toBe(ownerMe.body.id);
    expect(row[0].church_id).toBe(s.churchId);
    expect(row[0].title).toBe(LIVE_E2E_SESSION_TITLE);
    expect(row[0].status).toBe('active');
  });

  it('2) เพิ่มเพลงในเซสชันผ่าน WebSocket — ผู้ฟังใน session room ได้ live:songs:updated', async () => {
    const s = await seedChurchLiveSession();
    const leader = connectLiveSocket(baseUrl, s.ownerToken);
    const follower = connectLiveSocket(baseUrl, s.memberToken);
    try {
      await waitForSocketConnect(leader);
      await waitForSocketConnect(follower);

      await joinLiveSession(leader, s.sessionId, 'leader');
      await joinLiveSession(follower, s.sessionId, 'follower');

      const updated = onceSocketEvent(follower, LIVE_SERVER_EVENTS.SONGS_UPDATED);
      leader.emit(LIVE_CLIENT_EVENTS.SONGS_ADD, {
        sessionId: s.sessionId,
        songId: s.songIdA,
      });
      const payload = (await updated) as { sessionId: string; songs: { songId: string }[] };
      expect(payload.sessionId).toBe(s.sessionId);
      expect(payload.songs.some((x) => x.songId === s.songIdA)).toBe(true);
    } finally {
      leader.close();
      follower.close();
    }
  });

  it('3) เรียงลำดับเพลงผ่าน live:songs:reorder — ลำดับสลับตาม orderedLiveSongIds', async () => {
    const s = await seedChurchLiveSession();
    const leader = connectLiveSocket(baseUrl, s.ownerToken);
    try {
      await waitForSocketConnect(leader);
      await joinLiveSession(leader, s.sessionId, 'leader');

      leader.emit(LIVE_CLIENT_EVENTS.SONGS_ADD, { sessionId: s.sessionId, songId: s.songIdA });
      await onceSocketEvent(leader, LIVE_SERVER_EVENTS.SONGS_UPDATED);
      leader.emit(LIVE_CLIENT_EVENTS.SONGS_ADD, { sessionId: s.sessionId, songId: s.songIdB });
      const afterAdd = (await onceSocketEvent(leader, LIVE_SERVER_EVENTS.SONGS_UPDATED)) as {
        songs: { liveSongId: string; songId: string; sortOrder: number }[];
      };
      const ids = afterAdd.songs.map((x) => x.liveSongId);
      expect(ids).toHaveLength(2);

      const reordered = onceSocketEvent(leader, LIVE_SERVER_EVENTS.SONGS_UPDATED);
      leader.emit(LIVE_CLIENT_EVENTS.SONGS_REORDER, {
        sessionId: s.sessionId,
        orderedLiveSongIds: [ids[1], ids[0]],
      });
      const payload = (await reordered) as { songs: { songId: string }[] };
      expect(payload.songs.map((x) => x.songId)).toEqual([
        s.songIdB,
        s.songIdA,
      ]);
    } finally {
      leader.close();
    }
  });

  it('4) สมาชิกที่มีสิทธิ์ live.read join follower ได้ — คนข้างนอกได้ 404 เวลาอ่านสถานะ REST', async () => {
    const s = await seedChurchLiveSession();
    await createHttpServerRequest(app)
      .get(`/api/v1/app/live/sessions/${s.sessionId}`)
      .set(authBearerHeaders(s.outsiderToken))
      .expect(HttpStatus.NOT_FOUND);

    const memberSocket = connectLiveSocket(baseUrl, s.memberToken);
    try {
      await waitForSocketConnect(memberSocket);
      await joinLiveSession(memberSocket, s.sessionId, 'follower');
      const joined = await createHttpServerRequest(app)
        .get(`/api/v1/app/live/sessions/${s.sessionId}`)
        .set(authBearerHeaders(s.memberToken))
        .expect(HttpStatus.OK);
      expect(joined.body.session.id).toBe(s.sessionId);
    } finally {
      memberSocket.close();
    }
  });

  it('5) leader อัปเดต sync page — บันทึกลง DB (sync_state / pageVersion)', async () => {
    const s = await seedChurchLiveSession();
    const leader = connectLiveSocket(baseUrl, s.ownerToken);
    try {
      await waitForSocketConnect(leader);
      await joinLiveSession(leader, s.sessionId, 'leader');

      leader.emit(LIVE_CLIENT_EVENTS.SYNC_PAGE, {
        sessionId: s.sessionId,
        page: { songIndex: 2, sectionLabel: 'verse', lineIndex: 5 },
      });

      await waitForLiveSyncSongIndex(app, s.sessionId, s.ownerToken, 2);

      const api = await createHttpServerRequest(app)
        .get(`/api/v1/app/live/sessions/${s.sessionId}`)
        .set(authBearerHeaders(s.ownerToken))
        .expect(HttpStatus.OK);

      expect(api.body.session.syncState.songIndex).toBe(2);
      expect(api.body.session.syncState.sectionLabel).toBe('verse');
      expect(api.body.session.syncState.pageVersion).toBeGreaterThanOrEqual(1);
    } finally {
      leader.close();
    }
  });

  it('6) follower โหมดตาม leader รับ live:sync:broadcast — 7) โหมดอิสระไม่รับถ้ายังไม่ follow', async () => {
    const s = await seedChurchLiveSession();
    const leader = connectLiveSocket(baseUrl, s.ownerToken);
    const follower = connectLiveSocket(baseUrl, s.memberToken);
    try {
      await waitForSocketConnect(leader);
      await waitForSocketConnect(follower);

      await joinLiveSession(leader, s.sessionId, 'leader');
      await joinLiveSession(follower, s.sessionId, 'follower');

      /* ช่วงเงียบยาวขึ้นเล็กน้อย — ลดโอกาส flaky บนเครื่อง CI ที่คิว event ช้า */
      const silent = expectNoSocketEvent(follower, LIVE_SERVER_EVENTS.SYNC_BROADCAST, 5_000);
      leader.emit(LIVE_CLIENT_EVENTS.SYNC_PAGE, {
        sessionId: s.sessionId,
        page: { songIndex: 0 },
      });
      await silent;

      follower.emit(LIVE_CLIENT_EVENTS.FOLLOW_LEADER, { sessionId: s.sessionId });
      await onceSocketEvent(follower, LIVE_SERVER_EVENTS.FOLLOW_STATE);

      const broadcastWait = onceSocketEvent(follower, LIVE_SERVER_EVENTS.SYNC_BROADCAST);
      leader.emit(LIVE_CLIENT_EVENTS.SYNC_PAGE, {
        sessionId: s.sessionId,
        page: { songIndex: 7 },
      });
      const broadcast = (await broadcastWait) as {
        sessionId: string;
        sync: { songIndex: number };
      };
      expect(broadcast.sessionId).toBe(s.sessionId);
      expect(broadcast.sync.songIndex).toBe(7);
    } finally {
      leader.close();
      follower.close();
    }
  });

  it('8) snapshot ถาวร — GET /live/sessions/:id และ live:sync:request คืน sync_state ล่าสุด', async () => {
    const s = await seedChurchLiveSession();
    const leader = connectLiveSocket(baseUrl, s.ownerToken);
    try {
      await waitForSocketConnect(leader);
      await joinLiveSession(leader, s.sessionId, 'leader');

      leader.emit(LIVE_CLIENT_EVENTS.SYNC_PAGE, {
        sessionId: s.sessionId,
        page: { songIndex: 3 },
      });

      await waitForLiveSyncSongIndex(app, s.sessionId, s.ownerToken, 3);

      const viaHttp = await createHttpServerRequest(app)
        .get(`/api/v1/app/live/sessions/${s.sessionId}`)
        .set(authBearerHeaders(s.memberToken))
        .expect(HttpStatus.OK);
      expect(viaHttp.body.session.syncState.songIndex).toBe(3);

      const follower = connectLiveSocket(baseUrl, s.memberToken);
      try {
        await waitForSocketConnect(follower);
        await joinLiveSession(follower, s.sessionId, 'follower');

        const snap = onceSocketEvent(follower, LIVE_SERVER_EVENTS.SESSION_STATE);
        follower.emit(LIVE_CLIENT_EVENTS.SYNC_REQUEST, { sessionId: s.sessionId });
        const st = (await snap) as { session: { syncState: { songIndex: number } } };
        expect(st.session.syncState.songIndex).toBe(3);
      } finally {
        follower.close();
      }
    } finally {
      leader.close();
    }
  });

  it('9) การตั้งชื่อห้องและชื่อ event ตรงกับสัญญา (LIVE_ROOM_PREFIX + live.events)', async () => {
    const s = await seedChurchLiveSession();
    const socket = connectLiveSocket(baseUrl, s.ownerToken);
    try {
      await waitForSocketConnect(socket);
      const joinedP = onceSocketEvent(socket, LIVE_SERVER_EVENTS.JOINED);
      const stateP = onceSocketEvent(socket, LIVE_SERVER_EVENTS.SESSION_STATE);
      socket.emit(LIVE_CLIENT_EVENTS.JOIN, { sessionId: s.sessionId, participantMode: 'leader' });
      const joined = (await joinedP) as { room: string; sessionId: string };
      await stateP;
      expect(joined.room).toBe(liveSessionRoom(s.sessionId));
      expect(joined.room.startsWith(`${LIVE_ROOM_PREFIX}:`)).toBe(true);
      expect(joined.sessionId).toBe(s.sessionId);
      expect(LIVE_CLIENT_EVENTS.SYNC_PAGE).toBe('live:sync:page');
      expect(LIVE_SERVER_EVENTS.SESSION_STATE).toBe('live:session:state');
    } finally {
      socket.close();
    }
  });
});