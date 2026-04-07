import { DataSource } from 'typeorm';

import { SONGS_E2E_CHURCH_SLUG, SONGS_E2E_EMAILS, SONGS_E2E_SLUG_PREFIX } from './songs-e2e.fixtures';

export async function cleanupSongsE2EFixtures(dataSource: DataSource): Promise<void> {
  const schema = process.env.DB_SCHEMA ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error('Invalid DB_SCHEMA for songs E2E cleanup');
  }

  const emails = Object.values(SONGS_E2E_EMAILS);
  const songSlugPattern = `${SONGS_E2E_SLUG_PREFIX}%`;

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "resource_type" = 'song' AND "resource_id" IN (
       SELECT "id" FROM "${schema}"."songs" WHERE "slug" LIKE $1
     )`,
    [songSlugPattern],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "resource_type" = 'song' AND "resource_id" IN (
       SELECT "id" FROM "${schema}"."songs" WHERE "church_id" IN (
         SELECT "id" FROM "${schema}"."churches" WHERE "slug" = $1
       )
     )`,
    [SONGS_E2E_CHURCH_SLUG],
  );

  await dataSource.query(`DELETE FROM "${schema}"."songs" WHERE "slug" LIKE $1`, [songSlugPattern]);
  await dataSource.query(
    `DELETE FROM "${schema}"."songs" WHERE "church_id" IN (
       SELECT "id" FROM "${schema}"."churches" WHERE "slug" = $1
     )`,
    [SONGS_E2E_CHURCH_SLUG],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "scope_church_id" IN (
       SELECT "id" FROM "${schema}"."churches" WHERE "slug" = $1
     )`,
    [SONGS_E2E_CHURCH_SLUG],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "resource_type" = 'church' AND "resource_id" IN (
       SELECT "id" FROM "${schema}"."churches" WHERE "slug" = $1
     )`,
    [SONGS_E2E_CHURCH_SLUG],
  );

  await dataSource.query(`DELETE FROM "${schema}"."churches" WHERE "slug" = $1`, [SONGS_E2E_CHURCH_SLUG]);

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "actor_user_id" IN (
       SELECT "id" FROM "${schema}"."users" WHERE "email" = ANY ($1)
     )`,
    [emails],
  );

  await dataSource.query(`DELETE FROM "${schema}"."users" WHERE "email" = ANY ($1)`, [emails]);
}
