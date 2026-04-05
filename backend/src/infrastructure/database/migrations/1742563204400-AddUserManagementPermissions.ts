import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class AddUserManagementPermissions1742563204400 implements MigrationInterface {
  name = 'AddUserManagementPermissions1742563204400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      INSERT INTO "${schema}"."permissions" ("code", "module", "description") VALUES
        ('user.read', 'user', 'อ่านรายการผู้ใช้ (ผู้ดูแลระบบ)'),
        ('user.create', 'user', 'สร้างผู้ใช้ (ผู้ดูแลระบบ)'),
        ('user.update', 'user', 'แก้ไขผู้ใช้ (ผู้ดูแลระบบ)'),
        ('user.delete', 'user', 'ลบผู้ใช้ (ผู้ดูแลระบบ)')
      ON CONFLICT ("code") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "${schema}"."role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "${schema}"."roles" r
      INNER JOIN "${schema}"."permissions" p ON p.code IN (
        'user.read', 'user.create', 'user.update', 'user.delete'
      )
      WHERE r.code = 'system_admin'
      AND NOT EXISTS (
        SELECT 1 FROM "${schema}"."role_permissions" rp
        WHERE rp.role_id = r.id AND rp.permission_id = p.id
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      DELETE FROM "${schema}"."role_permissions"
      WHERE "permission_id" IN (
        SELECT id FROM "${schema}"."permissions"
        WHERE "code" IN ('user.read', 'user.create', 'user.update', 'user.delete')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "${schema}"."permissions"
      WHERE "code" IN ('user.read', 'user.create', 'user.update', 'user.delete')
    `);
  }
}
