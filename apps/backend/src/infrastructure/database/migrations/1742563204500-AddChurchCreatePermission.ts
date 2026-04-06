import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class AddChurchCreatePermission1742563204500 implements MigrationInterface {
  name = 'AddChurchCreatePermission1742563204500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    await queryRunner.query(`
      INSERT INTO "${schema}"."permissions" ("code", "module", "description") VALUES
        ('church.create', 'church', 'สร้างคริสตจักรใหม่')
      ON CONFLICT ("code") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "${schema}"."role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "${schema}"."roles" r
      INNER JOIN "${schema}"."permissions" p ON p.code = 'church.create'
      WHERE r.code IN ('system_admin', 'user')
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
      WHERE "permission_id" = (SELECT id FROM "${schema}"."permissions" WHERE code = 'church.create')
    `);
    await queryRunner.query(`
      DELETE FROM "${schema}"."permissions" WHERE "code" = 'church.create'
    `);
  }
}
