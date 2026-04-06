import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class CreateChurchesAndRbacTables1742563204000 implements MigrationInterface {
  name = 'CreateChurchesAndRbacTables1742563204000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      CREATE TABLE "${schema}"."churches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(200) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "owner_user_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_churches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_churches_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_churches_owner_user" FOREIGN KEY ("owner_user_id") REFERENCES "${schema}"."users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(120) NOT NULL,
        "module" character varying(80) NOT NULL,
        "description" character varying(255),
        CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(80) NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" character varying(255),
        "role_scope" character varying(20) NOT NULL,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "${schema}"."roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "${schema}"."permissions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "${schema}"."user_roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "scope_type" character varying(20) NOT NULL,
        "scope_id" uuid,
        "assigned_by" uuid,
        "effective_from" TIMESTAMPTZ,
        "effective_to" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_user_roles_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_user_roles_scope" CHECK (
          ("scope_type" = 'global' AND "scope_id" IS NULL) OR
          ("scope_type" = 'church' AND "scope_id" IS NOT NULL)
        ),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "${schema}"."roles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_church" FOREIGN KEY ("scope_id") REFERENCES "${schema}"."churches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_assigned_by" FOREIGN KEY ("assigned_by") REFERENCES "${schema}"."users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_user_id" ON "${schema}"."user_roles" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_role_id" ON "${schema}"."user_roles" ("role_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_roles_scope" ON "${schema}"."user_roles" ("scope_type", "scope_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."churches"`);
  }
}
