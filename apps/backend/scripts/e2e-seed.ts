/**
 * Seed ผู้ใช้ + เพลงสำหรับ E2E / Playwright (idempotent)
 *
 * รันจากรากโมโนด้วย: `yarn seed:e2e` (ดู root package.json)
 * ต้องมี DB ตาม .env.test และ migration แล้ว
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { DataSource, IsNull, Repository } from 'typeorm';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { SongEntity } from '../src/modules/songs/entities/song.entity';
import { SongsService } from '../src/modules/songs/songs.service';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { loadTestEnvironment } from '../test/support/bootstrap-test-env';
import { assignSystemAdminRole } from '../test/support/rbac-e2e.helper';

type E2eSeedConfig = {
  sharedPassword: string;
  users: {
    songEditor: { email: string; displayName: string };
    admin: { email: string; displayName: string };
    liveLeader: { email: string; displayName: string };
    liveFollower: { email: string; displayName: string };
  };
  songs: { code: string; title: string; chordproBody: string }[];
};

function loadSeedConfig(): E2eSeedConfig {
  const candidates = [
    join(process.cwd(), 'e2e-seed.config.json'),
    join(process.cwd(), '..', 'e2e-seed.config.json'),
    join(__dirname, '../../e2e-seed.config.json'),
    join(__dirname, '../../../e2e-seed.config.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf8')) as E2eSeedConfig;
    }
  }
  throw new Error('ไม่พบ e2e-seed.config.json — วางไว้ที่รากโปรเจกต์');
}

async function ensureUserId(
  authService: AuthService,
  userRepo: Repository<UserEntity>,
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  const existing = await userRepo.findOne({
    where: { email: email.toLowerCase(), deletedAt: IsNull() },
  });
  if (existing) {
    return existing.id;
  }
  const issued = await authService.register(
    { email, password, displayName },
    { requestId: 'e2e-seed' },
  );
  return issued.user.id;
}

async function ensureSong(
  songsService: SongsService,
  songRepo: Repository<SongEntity>,
  actorUserId: string,
  row: { code: string; title: string; chordproBody: string },
): Promise<void> {
  const found = await songRepo.findOne({
    where: { code: row.code, churchId: IsNull(), deletedAt: IsNull() },
  });
  if (found) {
    return;
  }
  await songsService.createSong(actorUserId, null, {
    title: row.title,
    chordproBody: row.chordproBody,
    code: row.code,
    isPublished: true,
  });
}

async function main(): Promise<void> {
  loadTestEnvironment();
  const config = loadSeedConfig();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const authService = app.get(AuthService);
    const songsService = app.get(SongsService);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);
    const songRepo = dataSource.getRepository(SongEntity);

    const pw = config.sharedPassword;

    const ids = {
      songEditor: await ensureUserId(authService, userRepo, config.users.songEditor.email, pw, config.users.songEditor.displayName),
      admin: await ensureUserId(authService, userRepo, config.users.admin.email, pw, config.users.admin.displayName),
      liveLeader: await ensureUserId(authService, userRepo, config.users.liveLeader.email, pw, config.users.liveLeader.displayName),
      liveFollower: await ensureUserId(authService, userRepo, config.users.liveFollower.email, pw, config.users.liveFollower.displayName),
    };

    for (const uid of Object.values(ids)) {
      await assignSystemAdminRole(dataSource, uid);
    }

    const actor = ids.songEditor;
    for (const song of config.songs) {
      await ensureSong(songsService, songRepo, actor, song);
    }

    // eslint-disable-next-line no-console
    console.log('[e2e-seed] สำเร็จ — ผู้ใช้ + เพลงพร้อม (system_admin ทั้งหมด)');
    // eslint-disable-next-line no-console
    console.log(
      [
        '',
        '# คัดลอกไป apps/frontend/.env.test (หรือ CI) — ค่าต้องตรง e2e-seed.config.json',
        `E2E_SONG_EDITOR_EMAIL=${config.users.songEditor.email}`,
        `E2E_SONG_EDITOR_PASSWORD=${pw}`,
        `E2E_ADMIN_EMAIL=${config.users.admin.email}`,
        `E2E_ADMIN_PASSWORD=${pw}`,
        `E2E_LIVE_LEADER_EMAIL=${config.users.liveLeader.email}`,
        `E2E_LIVE_LEADER_PASSWORD=${pw}`,
        `E2E_LIVE_FOLLOWER_EMAIL=${config.users.liveFollower.email}`,
        `E2E_LIVE_FOLLOWER_PASSWORD=${pw}`,
        '',
      ].join('\n'),
    );
  } finally {
    await app.close();
  }
}

void main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[e2e-seed]', err);
  process.exit(1);
});
