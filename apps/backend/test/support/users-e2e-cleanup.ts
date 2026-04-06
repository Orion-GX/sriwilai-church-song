import { DataSource } from 'typeorm';

import { USERS_E2E_EMAILS } from './users-e2e.fixtures';

/**
 * ลบผู้ใช้ fixture + audit ที่อ้าง actor เป็น user เหล่านั้น
 */
export async function cleanupUsersE2EFixtures(dataSource: DataSource): Promise<void> {
  const schema = process.env.DB_SCHEMA ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error('Invalid DB_SCHEMA for users E2E cleanup');
  }

  const emails = Object.values(USERS_E2E_EMAILS);

  await dataSource.query(
    `DELETE FROM "${schema}"."audit_logs" WHERE "actor_user_id" IN (
       SELECT "id" FROM "${schema}"."users" WHERE "email" = ANY ($1)
     )`,
    [emails],
  );

  await dataSource.query(`DELETE FROM "${schema}"."users" WHERE "email" = ANY ($1)`, [emails]);
}
