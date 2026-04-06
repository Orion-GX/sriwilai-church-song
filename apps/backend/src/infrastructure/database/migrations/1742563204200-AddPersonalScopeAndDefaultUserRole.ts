import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class AddPersonalScopeAndDefaultUserRole1742563204200 implements MigrationInterface {
  name = 'AddPersonalScopeAndDefaultUserRole1742563204200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      ALTER TABLE "${schema}"."user_roles"
      DROP CONSTRAINT IF EXISTS "CHK_user_roles_scope"
    `);
    await queryRunner.query(`
      ALTER TABLE "${schema}"."user_roles"
      ADD CONSTRAINT "CHK_user_roles_scope" CHECK (
        ("scope_type" = 'global' AND "scope_id" IS NULL) OR
        ("scope_type" = 'personal' AND "scope_id" IS NULL) OR
        ("scope_type" = 'church' AND "scope_id" IS NOT NULL)
      )
    `);

    await queryRunner.query(`
      INSERT INTO "${schema}"."permissions" ("code", "module", "description") VALUES
        ('setlist.personal.manage', 'setlist', 'จัดการ setlist ส่วนตัว'),
        ('setlist.personal.share', 'setlist', 'แชร์ setlist ส่วนตัว')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "${schema}"."roles" ("code", "name", "description", "role_scope", "is_system")
      VALUES ('user', 'User', 'ผู้ใช้ทั่วไปที่ยังไม่ผูกคริสตจักร', 'personal', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "${schema}"."role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "${schema}"."roles" r
      INNER JOIN "${schema}"."permissions" p
        ON p.code = ANY(ARRAY['song.read','setlist.personal.manage','setlist.personal.share']::varchar[])
      WHERE r.code = 'user'
      AND NOT EXISTS (
        SELECT 1
        FROM "${schema}"."role_permissions" rp
        WHERE rp.role_id = r.id AND rp.permission_id = p.id
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      DELETE FROM "${schema}"."role_permissions"
      WHERE "role_id" IN (SELECT id FROM "${schema}"."roles" WHERE code = 'user')
    `);
    await queryRunner.query(`
      DELETE FROM "${schema}"."user_roles"
      WHERE "role_id" IN (SELECT id FROM "${schema}"."roles" WHERE code = 'user')
    `);
    await queryRunner.query(`
      DELETE FROM "${schema}"."roles" WHERE "code" = 'user'
    `);
    await queryRunner.query(`
      DELETE FROM "${schema}"."permissions"
      WHERE "code" IN ('setlist.personal.manage','setlist.personal.share')
    `);

    await queryRunner.query(`
      ALTER TABLE "${schema}"."user_roles"
      DROP CONSTRAINT IF EXISTS "CHK_user_roles_scope"
    `);
    await queryRunner.query(`
      ALTER TABLE "${schema}"."user_roles"
      ADD CONSTRAINT "CHK_user_roles_scope" CHECK (
        ("scope_type" = 'global' AND "scope_id" IS NULL) OR
        ("scope_type" = 'church' AND "scope_id" IS NOT NULL)
      )
    `);
  }
}
