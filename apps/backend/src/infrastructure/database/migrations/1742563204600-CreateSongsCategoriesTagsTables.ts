import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class CreateSongsCategoriesTagsTables1742563204600 implements MigrationInterface {
  name = 'CreateSongsCategoriesTagsTables1742563204600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      CREATE TABLE "${schema}"."song_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(80) NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_song_categories_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_song_categories_slug_active"
      ON "${schema}"."song_categories" ("slug")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_song_categories_sort"
      ON "${schema}"."song_categories" ("sort_order", "name")
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."song_tags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(80) NOT NULL,
        "name" character varying(120) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_song_tags_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_song_tags_slug_active"
      ON "${schema}"."song_tags" ("slug")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."songs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "church_id" uuid,
        "title" character varying(255) NOT NULL,
        "slug" character varying(180) NOT NULL,
        "chordpro_body" text NOT NULL,
        "category_id" uuid,
        "is_published" boolean NOT NULL DEFAULT true,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_songs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_songs_church" FOREIGN KEY ("church_id")
          REFERENCES "${schema}"."churches"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_songs_category" FOREIGN KEY ("category_id")
          REFERENCES "${schema}"."song_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_songs_created_by" FOREIGN KEY ("created_by")
          REFERENCES "${schema}"."users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_songs_updated_by" FOREIGN KEY ("updated_by")
          REFERENCES "${schema}"."users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_songs_slug_global_active"
      ON "${schema}"."songs" ("slug")
      WHERE "church_id" IS NULL AND "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_songs_church_slug_active"
      ON "${schema}"."songs" ("church_id", "slug")
      WHERE "church_id" IS NOT NULL AND "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_songs_church_published"
      ON "${schema}"."songs" ("church_id", "is_published")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_songs_category"
      ON "${schema}"."songs" ("category_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."song_song_tags" (
        "song_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        CONSTRAINT "PK_song_song_tags" PRIMARY KEY ("song_id", "tag_id"),
        CONSTRAINT "FK_song_song_tags_song" FOREIGN KEY ("song_id")
          REFERENCES "${schema}"."songs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_song_song_tags_tag" FOREIGN KEY ("tag_id")
          REFERENCES "${schema}"."song_tags"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "${schema}"."song_categories" ("slug", "name", "sort_order") VALUES
        ('worship', 'Worship', 10),
        ('hymn', 'Hymn', 20),
        ('chorus', 'Chorus', 30),
        ('special', 'Special', 40)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."song_song_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."songs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."song_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."song_categories"`);
  }
}
