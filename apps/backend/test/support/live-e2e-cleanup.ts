import { DataSource } from 'typeorm';

import { LIVE_E2E_CHURCH_SLUG, LIVE_E2E_EMAILS, LIVE_E2E_SESSION_TITLE_PREFIX } from './live-e2e.fixtures';

const SONG_SLUG_PATTERN = 'se2e-live-%';

export async function cleanupLiveE2EFixtures(dataSource: DataSource): Promise<void> {
  const schema = process.env.DB_SCHEMA ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error('Invalid DB_SCHEMA for live E2E cleanup');
  }

  const emails = Object.values(LIVE_E2E_EMAILS);
  const sessionTitlePattern = `${LIVE_E2E_SESSION_TITLE_PREFIX}%`;

  await dataSource.query(
    `DELETE FROM "${schema}"."live_session_songs" WHERE "session_id" IN (
       SELECT "id" FROM "${schema}"."live_sessions" WHERE "title" LIKE $1
     )`,
    [sessionTitlePattern],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "resource_type" = 'live_session' AND "resource_id" IN (
       SELECT "id" FROM "${schema}"."live_sessions" WHERE "title" LIKE $1
     )`,
    [sessionTitlePattern],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."live_sessions" WHERE "title" LIKE $1`,
    [sessionTitlePattern],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "resource_type" = 'song' AND "resource_id" IN (
       SELECT "id" FROM "${schema}"."songs" WHERE "slug" LIKE $1
     )`,
    [SONG_SLUG_PATTERN],
  );

  await dataSource.query(`DELETE FROM "${schema}"."songs" WHERE "slug" LIKE $1`, [SONG_SLUG_PATTERN]);

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "scope_church_id" IN (
       SELECT "id" FROM "${schema}"."churches" WHERE "slug" = $1
     )`,
    [LIVE_E2E_CHURCH_SLUG],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "resource_type" = 'church' AND "resource_id" IN (
       SELECT "id" FROM "${schema}"."churches" WHERE "slug" = $1
     )`,
    [LIVE_E2E_CHURCH_SLUG],
  );

  await dataSource.query(`DELETE FROM "${schema}"."churches" WHERE "slug" = $1`, [LIVE_E2E_CHURCH_SLUG]);

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "actor_user_id" IN (
       SELECT "id" FROM "${schema}"."users" WHERE "email" = ANY ($1)
     )`,
    [emails],
  );

  await dataSource.query(`DELETE FROM "${schema}"."users" WHERE "email" = ANY ($1)`, [emails]);
}
