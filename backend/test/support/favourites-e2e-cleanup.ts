import { DataSource } from 'typeorm';

import { FAVOURITES_E2E_EMAILS, FAVOURITES_E2E_SLUG_PREFIX } from './favourites-e2e.fixtures';

export async function cleanupFavouritesE2EFixtures(dataSource: DataSource): Promise<void> {
  const schema = process.env.DB_SCHEMA ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error('Invalid DB_SCHEMA for favourites E2E cleanup');
  }

  const slugPattern = `${FAVOURITES_E2E_SLUG_PREFIX}%`;
  const emails = Object.values(FAVOURITES_E2E_EMAILS);

  await dataSource.query(
    `DELETE FROM "${schema}"."user_song_favorites" WHERE "song_id" IN (
       SELECT "id" FROM "${schema}"."songs" WHERE "slug" LIKE $1
     )`,
    [slugPattern],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "resource_type" = 'song' AND "resource_id" IN (
       SELECT "id" FROM "${schema}"."songs" WHERE "slug" LIKE $1
     )`,
    [slugPattern],
  );

  await dataSource.query(`DELETE FROM "${schema}"."songs" WHERE "slug" LIKE $1`, [slugPattern]);

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "actor_user_id" IN (
       SELECT "id" FROM "${schema}"."users" WHERE "email" = ANY ($1)
     )`,
    [emails],
  );

  await dataSource.query(`DELETE FROM "${schema}"."users" WHERE "email" = ANY ($1)`, [emails]);
}
