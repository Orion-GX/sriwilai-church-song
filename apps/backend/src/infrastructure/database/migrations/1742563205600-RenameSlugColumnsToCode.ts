import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class RenameSlugColumnsToCode1742563205600 implements MigrationInterface {
  name = 'RenameSlugColumnsToCode1742563205600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`ALTER TABLE "${schema}"."churches" RENAME COLUMN "slug" TO "code"`);
    await queryRunner.query(
      `ALTER TABLE "${schema}"."song_categories" RENAME COLUMN "slug" TO "code"`,
    );
    await queryRunner.query(`ALTER TABLE "${schema}"."song_tags" RENAME COLUMN "slug" TO "code"`);
    await queryRunner.query(`ALTER TABLE "${schema}"."songs" RENAME COLUMN "slug" TO "code"`);

    await queryRunner.query(
      `ALTER TABLE "${schema}"."churches" RENAME CONSTRAINT "UQ_churches_slug" TO "UQ_churches_code"`,
    );

    await queryRunner.query(`ALTER INDEX IF EXISTS "idx_churches_slug" RENAME TO "idx_churches_code"`);
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_song_categories_slug_active" RENAME TO "idx_song_categories_code_active"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_song_tags_slug_active" RENAME TO "idx_song_tags_code_active"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_songs_slug_global_active" RENAME TO "idx_songs_code_global_active"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_songs_church_slug_active" RENAME TO "idx_songs_church_code_active"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_songs_church_code_active" RENAME TO "idx_songs_church_slug_active"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_songs_code_global_active" RENAME TO "idx_songs_slug_global_active"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_song_tags_code_active" RENAME TO "idx_song_tags_slug_active"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_song_categories_code_active" RENAME TO "idx_song_categories_slug_active"`,
    );
    await queryRunner.query(`ALTER INDEX IF EXISTS "idx_churches_code" RENAME TO "idx_churches_slug"`);

    await queryRunner.query(
      `ALTER TABLE "${schema}"."churches" RENAME CONSTRAINT "UQ_churches_code" TO "UQ_churches_slug"`,
    );

    await queryRunner.query(`ALTER TABLE "${schema}"."songs" RENAME COLUMN "code" TO "slug"`);
    await queryRunner.query(`ALTER TABLE "${schema}"."song_tags" RENAME COLUMN "code" TO "slug"`);
    await queryRunner.query(
      `ALTER TABLE "${schema}"."song_categories" RENAME COLUMN "code" TO "slug"`,
    );
    await queryRunner.query(`ALTER TABLE "${schema}"."churches" RENAME COLUMN "code" TO "slug"`);
  }
}
