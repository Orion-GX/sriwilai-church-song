import { SetMetadata } from '@nestjs/common';

import { REQUIRE_CHURCH_ID_KEY } from '../rbac.constants';

/** บังคับให้ client ส่ง header `x-church-id` (UUID ของคริสตจักร) */
export const RequireChurchId = () => SetMetadata(REQUIRE_CHURCH_ID_KEY, true);
