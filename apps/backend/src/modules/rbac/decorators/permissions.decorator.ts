import { SetMetadata } from '@nestjs/common';

import { PERMISSIONS_KEY } from '../rbac.constants';

/**
 * ต้องมี permission ครบทุกตัวในรายการ (AND)
 * global permission จาก role global ใช้ได้ทุก request
 * permission จาก role แบบ church ต้องมี `x-church-id` ตรงกับ scope
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
