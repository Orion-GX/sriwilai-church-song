import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class CreateUserSongFavoritesTable1742563204900 implements MigrationInterface {
  name = 'CreateUserSongFavoritesTable1742563204900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      CREATE TABLE "${schema}"."user_song_favorites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "song_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_song_favorites_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_user_song_favorites_user"
          FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_song_favorites_song"
          FOREIGN KEY ("song_id") REFERENCES "${schema}"."songs"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_user_song_favorites_user_song" UNIQUE ("user_id", "song_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_song_favorites_user_id"
      ON "${schema}"."user_song_favorites" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_song_favorites_song_id"
      ON "${schema}"."user_song_favorites" ("song_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."user_song_favorites"`);
  }
}
