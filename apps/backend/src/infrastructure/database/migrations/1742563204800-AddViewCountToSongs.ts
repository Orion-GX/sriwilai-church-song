import type { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class AddViewCountToSongs1742563204800 implements MigrationInterface {
  name = 'AddViewCountToSongs1742563204800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      ALTER TABLE "${schema}"."songs"
      ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_songs_view_count ON "${schema}"."songs" (view_count DESC)
      WHERE deleted_at IS NULL AND is_published = TRUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP INDEX IF EXISTS "${schema}"."idx_songs_view_count"`);
    await queryRunner.query(`ALTER TABLE "${schema}"."songs" DROP COLUMN IF EXISTS view_count`);
  }
}
