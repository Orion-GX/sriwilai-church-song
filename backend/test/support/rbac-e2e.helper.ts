import { DataSource } from 'typeorm';

/**
 * มอบ role `system_admin` แบบ global ให้ user (สิทธิ์ user.read / user.update ฯลฯ ตาม seed migration)
 */
export async function assignSystemAdminRole(dataSource: DataSource, userId: string): Promise<void> {
  const schema = process.env.DB_SCHEMA ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error('Invalid DB_SCHEMA');
  }

  await dataSource.query(
    `
    INSERT INTO "${schema}"."user_roles" (
      "id",
      "user_id",
      "role_id",
      "scope_type",
      "scope_id",
      "assigned_by",
      "effective_from",
      "effective_to",
      "created_at",
      "updated_at",
      "deleted_at"
    )
    SELECT
      gen_random_uuid(),
      $1::uuid,
      r.id,
      'global',
      NULL,
      NULL,
      NULL,
      NULL,
      NOW(),
      NOW(),
      NULL
    FROM "${schema}"."roles" r
    WHERE r.code = 'system_admin'
      AND r.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "${schema}"."user_roles" ur
        INNER JOIN "${schema}"."roles" r2 ON r2.id = ur.role_id
        WHERE ur.user_id = $1::uuid
          AND r2.code = 'system_admin'
          AND ur.deleted_at IS NULL
      )
    LIMIT 1
    `,
    [userId],
  );
}
