import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { resolveRequestId } from '../auth/utils/request-id.util';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { SYSTEM_PERMISSION_CODES } from '../rbac/rbac.constants';

import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

const APP_THROTTLE = { default: { limit: 60, ttl: 60_000 } } as const;

@Controller({
  path: 'app/users',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private meta(req: Request, ip?: string) {
    return {
      requestId: resolveRequestId(req),
      ipAddress: ip ?? (typeof req.ip === 'string' ? req.ip : undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get('me')
  @Throttle(APP_THROTTLE)
  getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @Throttle(APP_THROTTLE)
  updateMe(
    @CurrentUser('sub') userId: string,
    @Body() body: UpdateProfileDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.usersService.updateProfile(userId, body, this.meta(req, ip));
  }

  @Get()
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.USER_READ)
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  @Post()
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.USER_CREATE)
  create(
    @CurrentUser('sub') actorUserId: string,
    @Body() body: AdminCreateUserDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.usersService.createUserAsAdmin(body, actorUserId, this.meta(req, ip));
  }

  @Get(':id')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.USER_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOneForAdmin(id);
  }

  @Patch(':id')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.USER_UPDATE)
  update(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminUpdateUserDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.usersService.updateUserAsAdmin(id, body, actorUserId, this.meta(req, ip));
  }

  @Delete(':id')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ): Promise<void> {
    await this.usersService.softDeleteUserAsAdmin(id, actorUserId, this.meta(req, ip));
  }
}
