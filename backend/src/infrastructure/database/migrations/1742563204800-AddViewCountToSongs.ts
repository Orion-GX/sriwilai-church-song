import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewCountToSongs1742563204800 implements MigrationInterface {
  name = 'AddViewCountToSongs1742563204800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE songs
      ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_songs_view_count ON songs (view_count DESC)
      WHERE deleted_at IS NULL AND is_published = TRUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_songs_view_count`);
    await queryRunner.query(`ALTER TABLE songs DROP COLUMN IF EXISTS view_count`);
  }
}
