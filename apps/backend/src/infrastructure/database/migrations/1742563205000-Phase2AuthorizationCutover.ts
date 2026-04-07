import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class Phase2AuthorizationCutover1742563205000 implements MigrationInterface {
  name = 'Phase2AuthorizationCutover1742563205000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}"."church_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "church_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "assigned_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_church_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_church_members_church" FOREIGN KEY ("church_id") REFERENCES "${schema}"."churches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_church_members_user" FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_church_members_role" FOREIGN KEY ("role_id") REFERENCES "${schema}"."roles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_church_members_assigned_by" FOREIGN KEY ("assigned_by") REFERENCES "${schema}"."users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_church_members_church_user"
      ON "${schema}"."church_members" ("church_id", "user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_church_members_user"
      ON "${schema}"."church_members" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_church_members_role"
      ON "${schema}"."church_members" ("role_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_church_members_active"
      ON "${schema}"."church_members" ("church_id", "user_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      INSERT INTO "${schema}"."church_members" ("church_id", "user_id", "role_id", "assigned_by", "created_at", "updated_at", "deleted_at")
      SELECT ur.scope_id, ur.user_id, ur.role_id, ur.assigned_by, ur.created_at, ur.updated_at, ur.deleted_at
      FROM "${schema}"."user_roles" ur
      INNER JOIN "${schema}"."roles" r ON r.id = ur.role_id
      WHERE ur.scope_type = 'church'
        AND ur.scope_id IS NOT NULL
        AND ur.deleted_at IS NULL
        AND r.deleted_at IS NULL
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "${schema}"."songs"
      ADD COLUMN IF NOT EXISTS "visibility" character varying(20) NOT NULL DEFAULT 'public'
    `);
    await queryRunner.query(`
      UPDATE "${schema}"."songs"
      SET "visibility" = CASE
        WHEN "church_id" IS NULL THEN 'public'
        ELSE 'church'
      END
      WHERE "visibility" IS NULL OR "visibility" = 'public'
    `);

    await queryRunner.query(`
      ALTER TABLE "${schema}"."personal_setlists"
      ADD COLUMN IF NOT EXISTS "church_id" uuid
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_personal_setlists_church'
        ) THEN
          ALTER TABLE "${schema}"."personal_setlists"
          ADD CONSTRAINT "FK_personal_setlists_church"
          FOREIGN KEY ("church_id") REFERENCES "${schema}"."churches"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_personal_setlists_church_id"
      ON "${schema}"."personal_setlists" ("church_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP INDEX IF EXISTS "${schema}"."idx_personal_setlists_church_id"`);
    await queryRunner.query(`
      ALTER TABLE "${schema}"."personal_setlists"
      DROP CONSTRAINT IF EXISTS "FK_personal_setlists_church"
    `);
    await queryRunner.query(`
      ALTER TABLE "${schema}"."personal_setlists"
      DROP COLUMN IF EXISTS "church_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "${schema}"."songs"
      DROP COLUMN IF EXISTS "visibility"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "${schema}"."uq_church_members_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "${schema}"."idx_church_members_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "${schema}"."idx_church_members_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "${schema}"."idx_church_members_church_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."church_members"`);
  }
}
