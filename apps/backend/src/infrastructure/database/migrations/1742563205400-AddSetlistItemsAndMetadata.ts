import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class AddSetlistItemsAndMetadata1742563205400 implements MigrationInterface {
  name = 'AddSetlistItemsAndMetadata1742563205400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      ALTER TABLE "${schema}"."personal_setlists"
      ADD COLUMN IF NOT EXISTS "service_date" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "location" character varying(180),
      ADD COLUMN IF NOT EXISTS "duration_minutes" integer,
      ADD COLUMN IF NOT EXISTS "team_name" character varying(180),
      ADD COLUMN IF NOT EXISTS "presentation_layout" character varying(16) NOT NULL DEFAULT 'vertical'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}"."personal_setlist_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "setlist_id" uuid NOT NULL,
        "song_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "artist" character varying(180),
        "original_key" character varying(24),
        "selected_key" character varying(24),
        "bpm" integer,
        "order" integer NOT NULL,
        "transition_notes" text,
        "notes" text,
        "capo" integer,
        "duration" integer,
        "arrangement" character varying(180),
        "version" character varying(180),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_personal_setlist_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_personal_setlist_items_setlist"
          FOREIGN KEY ("setlist_id") REFERENCES "${schema}"."personal_setlists"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_personal_setlist_items_setlist_id"
      ON "${schema}"."personal_setlist_items" ("setlist_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_personal_setlist_items_setlist_order"
      ON "${schema}"."personal_setlist_items" ("setlist_id", "order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."personal_setlist_items"`);
    await queryRunner.query(`
      ALTER TABLE "${schema}"."personal_setlists"
      DROP COLUMN IF EXISTS "service_date",
      DROP COLUMN IF EXISTS "location",
      DROP COLUMN IF EXISTS "duration_minutes",
      DROP COLUMN IF EXISTS "team_name",
      DROP COLUMN IF EXISTS "presentation_layout"
    `);
  }
}
