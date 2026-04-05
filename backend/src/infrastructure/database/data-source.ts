import { DataSource } from 'typeorm';
import './load-env';

import { AuditLogEntity } from '../../modules/audit/entities/audit-log.entity';
import { RefreshSessionEntity } from '../../modules/auth/entities/refresh-session.entity';
import { ChurchEntity } from '../../modules/churches/entities/church.entity';
import { PermissionEntity } from '../../modules/rbac/entities/permission.entity';
import { RolePermissionEntity } from '../../modules/rbac/entities/role-permission.entity';
import { RoleEntity } from '../../modules/rbac/entities/role.entity';
import { UserRoleEntity } from '../../modules/rbac/entities/user-role.entity';
import { PersonalSetlistEntity } from '../../modules/setlists/entities/personal-setlist.entity';
import { SongCategoryEntity } from '../../modules/songs/entities/song-category.entity';
import { SongTagEntity } from '../../modules/songs/entities/song-tag.entity';
import { LiveSessionSongEntity } from '../../modules/live/entities/live-session-song.entity';
import { LiveSessionEntity } from '../../modules/live/entities/live-session.entity';
import { SongEntity } from '../../modules/songs/entities/song.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';

const ssl =
  process.env.DB_SSL === 'true' || process.env.DB_SSL === '1'
    ? { rejectUnauthorized: false }
    : false;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'church_chord_pro',
  schema: process.env.DB_SCHEMA ?? 'public',
  ssl,
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: [
    UserEntity,
    RefreshSessionEntity,
    AuditLogEntity,
    ChurchEntity,
    PermissionEntity,
    RoleEntity,
    RolePermissionEntity,
    UserRoleEntity,
    PersonalSetlistEntity,
    SongEntity,
    SongCategoryEntity,
    SongTagEntity,
    LiveSessionEntity,
    LiveSessionSongEntity,
  ],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
