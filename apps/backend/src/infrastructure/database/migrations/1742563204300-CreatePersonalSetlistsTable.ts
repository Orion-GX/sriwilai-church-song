import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class CreatePersonalSetlistsTable1742563204300 implements MigrationInterface {
  name = 'CreatePersonalSetlistsTable1742563204300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      CREATE TABLE "${schema}"."personal_setlists" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_user_id" uuid NOT NULL,
        "title" character varying(180) NOT NULL,
        "description" text,
        "is_public" boolean NOT NULL DEFAULT false,
        "share_token" character varying(64),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_personal_setlists_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_personal_setlists_owner_user"
          FOREIGN KEY ("owner_user_id") REFERENCES "${schema}"."users"("id")
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_personal_setlists_owner_user_id"
      ON "${schema}"."personal_setlists" ("owner_user_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_personal_setlists_share_token"
      ON "${schema}"."personal_setlists" ("share_token")
      WHERE "share_token" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."personal_setlists"`);
  }
}
