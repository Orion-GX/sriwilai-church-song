import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { SYSTEM_PERMISSION_CODES } from '../rbac/rbac.constants';

import { AdminService } from './admin.service';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';

const APP_THROTTLE = { default: { limit: 60, ttl: 60_000 } } as const;

@Controller({
  path: 'app/admin',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SYSTEM_ADMIN)
  getDashboard(): Promise<AdminDashboardDto> {
    return this.adminService.getDashboard();
  }
}
