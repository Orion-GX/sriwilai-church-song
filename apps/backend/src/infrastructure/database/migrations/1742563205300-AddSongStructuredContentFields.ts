import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class AddSongStructuredContentFields1742563205300 implements MigrationInterface {
  name = 'AddSongStructuredContentFields1742563205300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      ALTER TABLE "${schema}"."songs"
      ADD COLUMN IF NOT EXISTS "content_json" jsonb NULL,
      ADD COLUMN IF NOT EXISTS "original_key" varchar(24) NULL,
      ADD COLUMN IF NOT EXISTS "tempo" integer NULL,
      ADD COLUMN IF NOT EXISTS "time_signature" varchar(16) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      ALTER TABLE "${schema}"."songs"
      DROP COLUMN IF EXISTS "time_signature",
      DROP COLUMN IF EXISTS "tempo",
      DROP COLUMN IF EXISTS "original_key",
      DROP COLUMN IF EXISTS "content_json"
    `);
  }
}
