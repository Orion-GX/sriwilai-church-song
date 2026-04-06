import { DataSource } from 'typeorm';

import { CHURCHES_E2E_EMAILS, CHURCHES_E2E_SLUG_PREFIX } from './churches-e2e.fixtures';

/**
 * ลบคริสตจักรทดสอบ (slug) + audit ที่อ้าง church + ผู้ใช้ fixture
 */
export async function cleanupChurchesE2EFixtures(dataSource: DataSource): Promise<void> {
  const schema = process.env.DB_SCHEMA ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error('Invalid DB_SCHEMA for churches E2E cleanup');
  }

  const emails = Object.values(CHURCHES_E2E_EMAILS);
  const slugPattern = `${CHURCHES_E2E_SLUG_PREFIX}%`;

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "scope_church_id" IN (
       SELECT "id" FROM "${schema}"."churches" WHERE "slug" LIKE $1
     )`,
    [slugPattern],
  );

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "resource_type" = 'church' AND "resource_id" IN (
       SELECT "id" FROM "${schema}"."churches" WHERE "slug" LIKE $1
     )`,
    [slugPattern],
  );

  await dataSource.query(`DELETE FROM "${schema}"."churches" WHERE "slug" LIKE $1`, [slugPattern]);

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "actor_user_id" IN (
       SELECT "id" FROM "${schema}"."users" WHERE "email" = ANY ($1)
     )`,
    [emails],
  );

  await dataSource.query(`DELETE FROM "${schema}"."users" WHERE "email" = ANY ($1)`, [emails]);
}
