import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class CreateRefreshSessionsTable1742563202000 implements MigrationInterface {
  name = 'CreateRefreshSessionsTable1742563202000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      CREATE TABLE "${schema}"."refresh_sessions" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "session_family_id" uuid NOT NULL,
        "refresh_token_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "revoke_reason" character varying(100),
        "ip_address" character varying(64),
        "user_agent" text,
        "rotated_from_session_id" uuid,
        "last_seen_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_sessions_user"
          FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id")
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_sessions_user_id" ON "${schema}"."refresh_sessions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_sessions_family_id" ON "${schema}"."refresh_sessions" ("session_family_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_sessions_expires_at" ON "${schema}"."refresh_sessions" ("expires_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_refresh_sessions_active"
      ON "${schema}"."refresh_sessions" ("user_id")
      WHERE "revoked_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."refresh_sessions"`);
  }
}
