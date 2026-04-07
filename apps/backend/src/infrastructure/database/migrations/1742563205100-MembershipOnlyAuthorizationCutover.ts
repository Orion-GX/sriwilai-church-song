import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class MembershipOnlyAuthorizationCutover1742563205100 implements MigrationInterface {
  name = 'MembershipOnlyAuthorizationCutover1742563205100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      INSERT INTO "${schema}"."permissions" ("code", "module", "description")
      VALUES ('live.control', 'live', 'ควบคุม live session')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "${schema}"."roles" ("code", "name", "description", "role_scope", "is_system")
      VALUES
        ('church_admin', 'Church Admin', 'ผู้ดูแลคริสตจักร', 'church', true),
        ('member', 'Member', 'สมาชิกทั่วไป', 'church', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      UPDATE "${schema}"."church_members" cm
      SET "role_id" = target.id,
          "updated_at" = NOW()
      FROM "${schema}"."roles" src
      INNER JOIN "${schema}"."roles" target
        ON target.code = CASE
          WHEN src.code IN ('church_owner', 'church_admin', 'worship_leader') THEN 'church_admin'
          ELSE 'member'
        END
      WHERE cm.role_id = src.id
        AND src.code IN ('church_owner', 'church_admin', 'worship_leader', 'member', 'viewer')
        AND cm.deleted_at IS NULL
    `);

    await queryRunner.query(`
      UPDATE "${schema}"."user_roles"
      SET "deleted_at" = NOW(), "updated_at" = NOW()
      WHERE "scope_type" = 'church'
        AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      DELETE FROM "${schema}"."role_permissions"
      WHERE "role_id" IN (
        SELECT id FROM "${schema}"."roles" WHERE code IN ('church_admin', 'member')
      )
    `);

    await queryRunner.query(`
      INSERT INTO "${schema}"."role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "${schema}"."roles" r
      INNER JOIN "${schema}"."permissions" p ON p.code = ANY($1::varchar[])
      WHERE r.code = 'church_admin'
      ON CONFLICT DO NOTHING
    `, [[
      'church.read',
      'church.update',
      'church.delete',
      'church.member.manage',
      'church.role.assign',
      'song.read',
      'song.create',
      'song.update',
      'song.delete',
      'setlist.read',
      'setlist.manage',
      'live.read',
      'live.manage',
      'live.control',
    ]]);

    await queryRunner.query(`
      INSERT INTO "${schema}"."role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "${schema}"."roles" r
      INNER JOIN "${schema}"."permissions" p ON p.code = ANY($1::varchar[])
      WHERE r.code = 'member'
      ON CONFLICT DO NOTHING
    `, [['song.read', 'setlist.read', 'live.read']]);

    await queryRunner.query(`
      UPDATE "${schema}"."roles"
      SET "deleted_at" = NOW(), "updated_at" = NOW()
      WHERE code IN ('church_owner', 'worship_leader', 'viewer')
        AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      UPDATE "${schema}"."roles"
      SET "deleted_at" = NULL, "updated_at" = NOW()
      WHERE code IN ('church_owner', 'worship_leader', 'viewer')
    `);

    await queryRunner.query(`
      DELETE FROM "${schema}"."role_permissions"
      WHERE "role_id" IN (
        SELECT id FROM "${schema}"."roles" WHERE code IN ('church_admin', 'member')
      )
    `);

    await queryRunner.query(`
      UPDATE "${schema}"."user_roles"
      SET "deleted_at" = NULL, "updated_at" = NOW()
      WHERE "scope_type" = 'church'
    `);

    await queryRunner.query(`
      DELETE FROM "${schema}"."permissions"
      WHERE "code" = 'live.control'
    `);
  }
}
