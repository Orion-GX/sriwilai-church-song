/**
 * slug ขึ้นต้นด้วย ce2e- เพื่อลบทิ้งใน cleanup (ฐานข้อมูล test เท่านั้น)
 */
export const CHURCHES_E2E_SLUG_PREFIX = 'ce2e-';

export const CHURCHES_E2E_EMAILS = {
  owner: 'churches-e2e-owner@example.test',
  stranger: 'churches-e2e-stranger@example.test',
  churchAdminJoiner: 'churches-e2e-church-admin@example.test',
  plainMember: 'churches-e2e-plain-member@example.test',
} as const;

export const CHURCHES_E2E_SLUGS = {
  alpha: 'ce2e-alpha',
  beta: 'ce2e-beta',
  accessAlpha: 'ce2e-access-alpha',
  deleteDemo: 'ce2e-delete-demo',
  afterDelete: 'ce2e-after-delete',
} as const;
