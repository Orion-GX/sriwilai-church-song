import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class CreateAuditLogsTable1742563203000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1742563203000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      CREATE TABLE "${schema}"."audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "occurred_at" TIMESTAMPTZ NOT NULL,
        "actor_user_id" uuid,
        "actor_type" character varying(30) NOT NULL,
        "action" character varying(150) NOT NULL,
        "resource_type" character varying(100) NOT NULL,
        "resource_id" uuid,
        "scope_church_id" uuid,
        "request_id" character varying(100),
        "ip_hash" character varying(128),
        "user_agent" text,
        "before_data" jsonb,
        "after_data" jsonb,
        "metadata" jsonb,
        "severity" character varying(20) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_actor_user"
          FOREIGN KEY ("actor_user_id") REFERENCES "${schema}"."users"("id")
          ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_occurred_at" ON "${schema}"."audit_logs" ("occurred_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_actor_user_id" ON "${schema}"."audit_logs" ("actor_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_action" ON "${schema}"."audit_logs" ("action")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_resource"
      ON "${schema}"."audit_logs" ("resource_type", "resource_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_audit_logs_scope_church"
      ON "${schema}"."audit_logs" ("scope_church_id", "occurred_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."audit_logs"`);
  }
}
