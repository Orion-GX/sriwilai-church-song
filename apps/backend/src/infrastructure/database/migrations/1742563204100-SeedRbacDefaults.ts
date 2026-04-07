import { MigrationInterface, QueryRunner } from 'typeorm';

function schemaName(): string {
  const s = process.env.DB_SCHEMA || 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    throw new Error('Invalid DB_SCHEMA');
  }
  return s;
}

export class SeedRbacDefaults1742563204100 implements MigrationInterface {
  name = 'SeedRbacDefaults1742563204100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();

    await queryRunner.query(`
      INSERT INTO "${schema}"."permissions" ("code", "module", "description") VALUES
        ('system.admin', 'system', 'จัดการระบบเต็มรูปแบบ'),
        ('audit.read', 'audit', 'อ่าน audit log'),
        ('church.read', 'church', 'ดูข้อมูลคริสตจักร'),
        ('church.update', 'church', 'แก้ไขคริสตจักร'),
        ('church.delete', 'church', 'ลบคริสตจักร'),
        ('church.member.manage', 'church', 'จัดการสมาชิกในคริสตจักร'),
        ('church.role.assign', 'church', 'มอบหมาย role ในคริสตจักร'),
        ('song.read', 'song', 'อ่านเพลง'),
        ('song.create', 'song', 'สร้างเพลง'),
        ('song.update', 'song', 'แก้ไขเพลง'),
        ('song.delete', 'song', 'ลบเพลง'),
        ('setlist.read', 'setlist', 'อ่าน setlist'),
        ('setlist.manage', 'setlist', 'จัดการ setlist'),
        ('setlist.personal.manage', 'setlist', 'จัดการ setlist ส่วนตัว'),
        ('setlist.personal.share', 'setlist', 'แชร์ setlist ส่วนตัว'),
        ('live.read', 'live', 'ดู live session'),
        ('live.manage', 'live', 'จัดการ live session'),
        ('live.control', 'live', 'ควบคุม live session')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "${schema}"."roles" ("code", "name", "description", "role_scope", "is_system") VALUES
        ('system_admin', 'System Admin', 'ผู้ดูแลระบบทั้งแพลตฟอร์ม', 'global', true),
        ('church_admin', 'Church Admin', 'ผู้ดูแลคริสตจักร', 'church', true),
        ('member', 'Member', 'สมาชิกทั่วไป', 'church', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    const linkAll = async (roleCode: string): Promise<void> => {
      await queryRunner.query(
        `
        INSERT INTO "${schema}"."role_permissions" ("role_id", "permission_id")
        SELECT r.id, p.id
        FROM "${schema}"."roles" r
        CROSS JOIN "${schema}"."permissions" p
        WHERE r.code = $1
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}"."role_permissions" rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
      `,
        [roleCode],
      );
    };

    const linkWhereCodes = async (roleCode: string, permissionCodes: string[]): Promise<void> => {
      await queryRunner.query(
        `
        INSERT INTO "${schema}"."role_permissions" ("role_id", "permission_id")
        SELECT r.id, p.id
        FROM "${schema}"."roles" r
        INNER JOIN "${schema}"."permissions" p ON p.code = ANY($2::varchar[])
        WHERE r.code = $1
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}"."role_permissions" rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
      `,
        [roleCode, permissionCodes],
      );
    };

    await linkAll('system_admin');

    await linkWhereCodes('church_admin', [
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
    ]);

    await linkWhereCodes('member', ['song.read', 'setlist.read', 'live.read']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = schemaName();
    const systemRoles = [
      'system_admin',
      'church_admin',
      'member',
      'user',
    ];
    await queryRunner.query(
      `
      DELETE FROM "${schema}"."user_roles"
      WHERE "role_id" IN (SELECT id FROM "${schema}"."roles" WHERE code = ANY($1::varchar[]))
    `,
      [systemRoles],
    );
    await queryRunner.query(
      `
      DELETE FROM "${schema}"."role_permissions"
      WHERE "role_id" IN (SELECT id FROM "${schema}"."roles" WHERE code = ANY($1::varchar[]))
    `,
      [systemRoles],
    );
    await queryRunner.query(
      `
      DELETE FROM "${schema}"."roles" WHERE code = ANY($1::varchar[])
    `,
      [systemRoles],
    );
    await queryRunner.query(`
      DELETE FROM "${schema}"."permissions" WHERE "code" IN (
        'system.admin','audit.read','church.read','church.update','church.delete',
        'church.member.manage','church.role.assign',
        'song.read','song.create','song.update','song.delete',
        'setlist.read','setlist.manage','setlist.personal.manage','setlist.personal.share','live.read','live.manage','live.control'
      )
    `);
  }
}
