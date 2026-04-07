export const ROLES_KEY = 'rbac_roles';
export const PERMISSIONS_KEY = 'rbac_permissions';
/** บังคับให้มี header x-church-id (ใช้กับ role/permission ที่อิง church) */
export const REQUIRE_CHURCH_ID_KEY = 'rbac_require_church_id';

export const CHURCH_ID_HEADER = 'x-church-id';

/** รหัส system roles (global/personal) */
export const SYSTEM_ROLE_CODES = {
  SYSTEM_ADMIN: 'system_admin',
  USER: 'user',
} as const;

/** รหัส church roles */
export const CHURCH_ROLE_CODES = {
  CHURCH_ADMIN: 'church_admin',
  MEMBER: 'member',
} as const;

export const SONG_VISIBILITY = {
  PUBLIC: 'public',
  CHURCH: 'church',
} as const;

/** ชุด permission เป้าหมายใหม่ */
export const PERMISSIONS = {
  SYSTEM_ADMIN: 'system.admin',
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  AUDIT_READ: 'audit.read',
  CHURCH_READ: 'church.read',
  CHURCH_CREATE: 'church.create',
  CHURCH_UPDATE: 'church.update',
  CHURCH_DELETE: 'church.delete',
  CHURCH_MEMBER_MANAGE: 'church.member.manage',
  CHURCH_ROLE_ASSIGN: 'church.role.assign',
  SONG_READ: 'song.read',
  SONG_CREATE: 'song.create',
  SONG_UPDATE: 'song.update',
  SONG_DELETE: 'song.delete',
  SETLIST_READ: 'setlist.read',
  SETLIST_MANAGE: 'setlist.manage',
  SETLIST_PERSONAL_MANAGE: 'setlist.personal.manage',
  SETLIST_PERSONAL_SHARE: 'setlist.personal.share',
  LIVE_READ: 'live.read',
  LIVE_MANAGE: 'live.manage',
  LIVE_CONTROL: 'live.control',
} as const;

/** backward-compatible alias */
export const SYSTEM_PERMISSION_CODES = PERMISSIONS;
