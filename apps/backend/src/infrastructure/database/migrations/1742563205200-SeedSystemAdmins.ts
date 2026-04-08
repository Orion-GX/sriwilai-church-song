import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

type SeedAdmin = {
  email: string;
  displayName: string;
  passwordHash: string;
};

const SEEDED_ADMINS: SeedAdmin[] = [
  {
    email: 'admin1@sriwilai.local',
    displayName: 'admin1',
    passwordHash: '$2b$10$JdW/Xxgi4HKi.TXVF1nzdeld0baDEm8syG5hk3/ZLr8yn82nZYl8i', // Admin@1234
  },
  {
    email: 'admin2@sriwilai.local',
    displayName: 'admin2',
    passwordHash: '$2b$10$ztELpVwZ2vmxAKZaWP6VGukkzSwvci.CwGfLHp3PcExiDzDzoiorC',
  },
  {
    email: 'admin3@sriwilai.local',
    displayName: 'admin3',
    passwordHash: '$2b$10$mV5vow14n6iP2jsBnFBLpOQoFU3S7SovD8IxdbMtEeLAZG/PvwRZa',
  },
];

export class SeedSystemAdmins1742563205200 implements MigrationInterface {
  name = 'SeedSystemAdmins1742563205200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    const emails = SEEDED_ADMINS.map((x) => x.email);

    for (const admin of SEEDED_ADMINS) {
      await queryRunner.query(
        `
        INSERT INTO "${schema}"."users" (
          "id",
          "email",
          "password_hash",
          "display_name",
          "status",
          "email_verified_at",
          "last_login_at",
          "created_at",
          "updated_at",
          "deleted_at"
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          'active',
          NULL,
          NULL,
          NOW(),
          NOW(),
          NULL
        )
        ON CONFLICT DO NOTHING
      `,
        [admin.email, admin.passwordHash, admin.displayName],
      );
    }

    await queryRunner.query(
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
        u.id,
        r.id,
        'global',
        NULL,
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW(),
        NULL
      FROM "${schema}"."users" u
      INNER JOIN "${schema}"."roles" r ON r.code = 'system_admin' AND r.deleted_at IS NULL
      WHERE u.email = ANY($1::varchar[])
        AND u.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "${schema}"."user_roles" ur
          WHERE ur.user_id = u.id
            AND ur.role_id = r.id
            AND ur.scope_type = 'global'
            AND ur.deleted_at IS NULL
        )
    `,
      [emails],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    const emails = SEEDED_ADMINS.map((x) => x.email);

    await queryRunner.query(
      `
      DELETE FROM "${schema}"."user_roles"
      WHERE "user_id" IN (
        SELECT id
        FROM "${schema}"."users"
        WHERE email = ANY($1::varchar[])
      )
    `,
      [emails],
    );

    await queryRunner.query(
      `
      DELETE FROM "${schema}"."users"
      WHERE "email" = ANY($1::varchar[])
    `,
      [emails],
    );
  }
}
