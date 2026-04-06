import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../rbac.constants';

/**
 * ต้องมี role ใด role หนึ่งในรายการ (OR)
 * สำหรับ role แบบ church ต้องส่ง header `x-church-id` (หรือใช้ @RequireChurchId())
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
