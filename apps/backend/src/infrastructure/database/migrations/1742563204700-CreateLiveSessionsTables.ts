import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class CreateLiveSessionsTables1742563204700 implements MigrationInterface {
  name = 'CreateLiveSessionsTables1742563204700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      CREATE TABLE "${schema}"."live_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "church_id" uuid,
        "leader_user_id" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'active',
        "sync_state" jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "ended_at" TIMESTAMPTZ,
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_live_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_live_sessions_church" FOREIGN KEY ("church_id")
          REFERENCES "${schema}"."churches"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_live_sessions_leader" FOREIGN KEY ("leader_user_id")
          REFERENCES "${schema}"."users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_live_sessions_church_status"
      ON "${schema}"."live_sessions" ("church_id", "status")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_live_sessions_leader"
      ON "${schema}"."live_sessions" ("leader_user_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."live_session_songs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL,
        "song_id" uuid NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_live_session_songs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_live_session_songs_session" FOREIGN KEY ("session_id")
          REFERENCES "${schema}"."live_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_live_session_songs_song" FOREIGN KEY ("song_id")
          REFERENCES "${schema}"."songs"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_live_session_songs_session_song"
      ON "${schema}"."live_session_songs" ("session_id", "song_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_live_session_songs_session_order"
      ON "${schema}"."live_session_songs" ("session_id", "sort_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."live_session_songs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."live_sessions"`);
  }
}
