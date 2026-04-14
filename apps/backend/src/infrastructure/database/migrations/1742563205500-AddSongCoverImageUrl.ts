import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class AddSongCoverImageUrl1742563205500 implements MigrationInterface {
  name = 'AddSongCoverImageUrl1742563205500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      ALTER TABLE "${schema}"."songs"
      ADD COLUMN IF NOT EXISTS "cover_image_url" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      ALTER TABLE "${schema}"."songs"
      DROP COLUMN IF EXISTS "cover_image_url"
    `);
  }
}
