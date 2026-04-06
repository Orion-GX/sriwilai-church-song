import { DataSource } from 'typeorm';

import { AUTH_E2E_FIXTURE_EMAILS } from './auth-e2e.fixtures';

/**
 * ลบผู้ใช้ fixture และ audit ที่อ้างถึง user เหล่านั้น (ฐานข้อมูล test เท่านั้น)
 */
export async function cleanupAuthE2EFixtureUsers(dataSource: DataSource): Promise<void> {
  const schema = process.env.DB_SCHEMA ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error('Invalid DB_SCHEMA for auth E2E cleanup');
  }

  const emails = Object.values(AUTH_E2E_FIXTURE_EMAILS);

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "actor_user_id" IN (
       SELECT "id" FROM "${schema}"."users" WHERE "email" = ANY ($1)
     )`,
    [emails],
  );

  await dataSource.query(`DELETE FROM "${schema}"."users" WHERE "email" = ANY ($1)`, [emails]);
}
