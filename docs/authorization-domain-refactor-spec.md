# Authorization Domain Refactor Spec

This document implements two assigned to-dos:

- `inventory-current-model`
- `design-target-rbac-domain`

It intentionally does not edit the original plan file.

## 1) Verified current model inventory (to migrate)

### 1.1 RBAC data model currently in use

Current authz is based on `roles`, `permissions`, `role_permissions`, and `user_roles`:

- `roles`: global/church/personal template via `role_scope`
- `permissions`: flat permission code list
- `role_permissions`: many-to-many mapping
- `user_roles`: runtime assignment with `scope_type` (`global|personal|church`) and `scope_id` (church UUID for church scope)

Current system role codes:

- `system_admin` (global)
- `user` (personal)
- church-scoped: `church_owner`, `church_admin`, `worship_leader`, `member`, `viewer`

Current permission codes in production migrations/constants:

- system: `system.admin`, `audit.read`
- user: `user.read`, `user.create`, `user.update`, `user.delete`
- church: `church.read`, `church.create`, `church.update`, `church.delete`, `church.member.manage`, `church.role.assign`
- song: `song.read`, `song.create`, `song.update`, `song.delete`
- setlist: `setlist.read`, `setlist.manage`, `setlist.personal.manage`, `setlist.personal.share`
- live: `live.read`, `live.manage`

### 1.2 Current role-to-permission behavior

Based on seed migrations:

- `system_admin`: all permissions (cross-join all)
- `church_owner`: church admin + song + setlist + live + audit (no explicit `system.admin`)
- `church_admin`: church read/update/member manage + song CRUD + setlist + live
- `worship_leader`: song CRUD + setlist + live
- `member`: `song.read`, `setlist.read`, `live.read`
- `viewer`: `song.read`, `setlist.read`
- `user` (personal): `song.read`, `setlist.personal.manage`, `setlist.personal.share`, and later `church.create`

### 1.3 Guard + request context behavior

Current runtime checks:

- `JwtAuthGuard`: enforces JWT except `@Public()`
- `PermissionsGuard`:
  - reads `@Permissions(...)`
  - optionally requires `x-church-id` when `@RequireChurchId()`
  - checks `rbacService.userHasAllPermissions(userId, permissions, churchId?)`
- `RolesGuard`:
  - reads `@Roles(...)`
  - same optional `x-church-id` logic
  - checks `rbacService.userHasAnyRole(userId, roles, churchId?)`
- `RbacService`:
  - aggregates active role assignments
  - always includes `scope_type IN ('global','personal')`
  - includes church-scoped assignments only when request has `x-church-id`

Important migration fact:

- church context is header-driven today (`x-church-id`), not first-class membership context resolved from a dedicated church-membership table.

### 1.4 Domain coupling points that must move

Churches:

- church membership is implemented as `user_roles(scope_type='church', scope_id=churchId)`
- owner logic is split between `churches.owner_user_id` and `church_owner` role assignment
- member add/update/remove mutates `user_roles`

Songs:

- `songs.church_id` nullable for global vs church-owned songs
- write permission checks rely on `song.*` with scope derived from song `church_id`
- no explicit visibility enum; effective visibility is implicit via `is_published` + nullable `church_id`

Setlists:

- still personal-owned model (`personal_setlists.owner_user_id`)
- gated by personal permissions (`setlist.personal.manage`, `setlist.personal.share`)
- not church-owned as target model requires

Live:

- `live_sessions.church_id` nullable and `leader_user_id` mandatory
- create/list/edit/end gated by `live.read`/`live.manage` and/or leader override
- current end/edit rule already partially follows desired shape: leader OR `live.manage`

### 1.5 Backend endpoints/modules currently bound to legacy codes

- Admin dashboard: `system.admin`
- Users CRUD: `user.*`
- Churches: partly decorator-gated (`church.create`) and partly service-scoped checks (`church.*`)
- Songs admin/service: `song.*`
- Setlists personal: `setlist.personal.*`
- Live: `live.manage` / `live.read` (+ leader override)

### 1.6 Frontend gating currently in use

Current frontend does not carry effective permission context:

- auth store persists only `{ accessToken, user }`
- no `currentChurch`, no membership list, no effective permission projection
- api client does not carry scoped church context by default
- at least one major gate uses "call API then inspect 403" (`/dashboard/admin` page)

## 2) Target 2-layer RBAC domain design (all modules)

## 2.1 Two-layer authorization model

Layer A: System layer (platform-wide)

- entities:
  - `system_roles`
  - `user_system_roles`
- scope:
  - global only (no church_id)
- purpose:
  - cross-tenant/platform administration
  - global catalog management where explicitly intended

Layer B: Church layer (tenant-scoped)

- entity:
  - `church_members`
- scope:
  - one row per `(church_id, user_id)` with church role
- purpose:
  - all church-bound operations across churches/songs/setlists/live

Resolution rule:

- final authorization = union of grants from:
  - system layer grants
  - church layer grants for selected church context
- with explicit overrides/bypass rules defined below.

## 2.2 Target schema

Additive migration target:

- `system_roles`
  - `id`, `code` unique, `name`, `description`, timestamps, soft-delete
- `user_system_roles`
  - `id`, `user_id`, `system_role_id`, `assigned_by`, effective window, soft-delete
- `church_members`
  - `id`, `church_id`, `user_id`, `church_role_code`, `is_owner` (or role-driven owner), timestamps, soft-delete
  - unique active membership per `(church_id, user_id)`
- `permissions` (reuse/normalize)
  - canonical permission registry used by both layers
- `role_permissions` split option:
  - either keep one table keyed by role-type metadata
  - or split to `system_role_permissions` + `church_role_permissions` (preferred for clarity)

Domain model changes:

- `songs.visibility` enum: `public | church`
  - replaces implicit nullable church semantics for access rules
- church songs:
  - keep `songs.church_id` nullable only when `visibility='public'`
- setlists:
  - introduce church ownership (`setlists.church_id`) and creator field
  - deprecate `personal_setlists` after backfill/cutover
- live:
  - keep `church_id` + `leader_user_id` ownership semantics

## 2.3 Target role catalogs

System roles (`SYSTEM_ROLE_CODES`):

- `system_admin`
- `support_admin` (optional but recommended)
- `analytics_viewer` (optional)

Church roles (`CHURCH_ROLE_CODES`):

- `church_owner`
- `church_admin`
- `worship_leader`
- `member`
- `viewer`

## 2.4 Target permission set (canonical)

System-level:

- `system.admin`
- `audit.read`
- `user.read`, `user.create`, `user.update`, `user.delete`

Church domain:

- `church.read`
- `church.create` (system or authenticated baseline policy decision; see 2.8)
- `church.update`
- `church.delete`
- `church.member.read`
- `church.member.manage`
- `church.role.assign`

Song domain:

- `song.read.public`
- `song.read.church`
- `song.create.public`
- `song.create.church`
- `song.update.public`
- `song.update.church`
- `song.delete.public`
- `song.delete.church`

Setlist domain:

- `setlist.read.church`
- `setlist.create.church`
- `setlist.update.church`
- `setlist.delete.church`
- `setlist.share.church`

Live domain:

- `live.read`
- `live.create`
- `live.control`
- `live.manage`

Compatibility aliases (temporary during migration):

- map legacy `song.read` -> `song.read.public|song.read.church` (context-based)
- map legacy `song.create|update|delete` similarly
- map `live.manage` to `live.control` + `live.manage` until cutover
- map `setlist.personal.*` to church setlist permissions only for transitional endpoints

## 2.5 Permission matrix by role

System roles:

- `system_admin`:
  - all system permissions
  - bypass for church-scoped checks (explicit rule)
- `support_admin` (optional):
  - `audit.read`, `user.read`, limited support permissions only

Church roles (within selected church):

- `church_owner`:
  - full church permissions including delete/member/role assignment
  - song church CRUD
  - setlist church CRUD/share
  - live full (`live.read`, `live.create`, `live.control`, `live.manage`)
- `church_admin`:
  - church read/update/member manage/role assign (except owner transfer unless explicit)
  - song church CRUD
  - setlist church CRUD/share
  - live read/create/control/manage
- `worship_leader`:
  - church read
  - song church read/create/update
  - setlist church read/create/update/share
  - live read/create/control
- `member`:
  - church read
  - song read church/public
  - setlist read church
  - live read
- `viewer`:
  - church read
  - song read church/public
  - setlist read church

## 2.6 Authorization rules by module

Auth/RBAC core:

- resolve effective grants from:
  - system grants
  - church grants using `currentChurchId`
- reject church-scoped permission checks if no church context (unless endpoint explicitly global/public)

Churches module:

- list my churches: membership-based from `church_members`
- create church:
  - policy option A: requires `church.create`
  - policy option B: authenticated users can create first church and become owner
- member management: requires `church.member.manage`
- role assignment: requires `church.role.assign`
- owner safety rules:
  - cannot remove last owner
  - owner transfer is explicit action

Songs module:

- read public songs:
  - allow guest if `visibility=public && is_published=true`
- read church songs:
  - require church membership + `song.read.church`
- create/update/delete church songs:
  - require selected church + church-scoped permission
- public catalog mutation:
  - requires system-level permission (`song.*.public`) or `system_admin`

Setlists module:

- all new setlist operations are church-scoped
- require selected church + corresponding `setlist.*.church`
- replace personal endpoints with church endpoints, keep compatibility wrappers short-term

Live module:

- create session: `live.create` in selected church
- read/list/join: `live.read` in session church
- control playlist/sync/end:
  - allow if `leader_user_id === actor`
  - OR actor has `live.control` (or `live.manage`) in session church
- manage (force end/delete/admin ops): `live.manage`

Admin/User/Audit modules:

- remain system-layer only
- never depend on church context

## 2.7 Guard/resolver contract (target)

Introduce explicit context resolver:

- request-level `currentChurchId` source priority:
  1. explicit endpoint param/header/query (compat mode)
  2. user-selected church in token/session claim (future)

Guard behavior:

- `PermissionsGuard` evaluates permission descriptors:
  - `scope: 'system' | 'church' | 'public'`
- `ChurchScopeGuard` ensures selected church + active membership where needed
- `SystemAdminBypass`:
  - bypass church permission checks
  - does not bypass resource existence checks

## 2.8 Migration mapping from current to target

Data mapping:

- `roles(role_scope='global'|'personal')` -> `system_roles` (+ mapping table)
- `user_roles(scope_type='global'|'personal')` -> `user_system_roles`
- `user_roles(scope_type='church')` -> `church_members` with `church_role_code`

Permission mapping examples:

- `song.read` -> `song.read.public` + `song.read.church`
- `song.create` -> `song.create.public` (system) and/or `song.create.church` (church)
- `setlist.personal.manage` -> transitional mapping to `setlist.create.church|setlist.update.church`
- `setlist.personal.share` -> `setlist.share.church`
- `live.manage` -> `live.control` + `live.manage` during compatibility period

API compatibility:

- keep legacy decorators/constants as aliases in phase-in period
- migrate controllers/services to new permission codes module-by-module
- remove aliases only after test + seed cutover

## 2.9 Frontend target authz model

Auth state target:

- `systemRoles: string[]`
- `churchMemberships: { churchId, churchRoleCode }[]`
- `currentChurchId: string | null`
- `effectivePermissions: string[]` (derived by resolver API or local matrix)

Client behavior:

- attach selected church context automatically for church-scoped API calls
- provide `useCan(permission, options)` hook for action-level gating
- avoid "probe by 403" for primary UI gating; reserve 403 handling as fallback

## 2.10 Exit criteria for these two to-dos

`inventory-current-model` is complete when:

- all legacy role/permission/scope mechanisms above are confirmed and listed
- all affected module coupling points are identified
- frontend current gating limitations are recorded

`design-target-rbac-domain` is complete when:

- two-layer schema is defined
- canonical permission set and role matrix are defined
- per-module authorization rules are specified
- migration mapping from current to target is explicit
