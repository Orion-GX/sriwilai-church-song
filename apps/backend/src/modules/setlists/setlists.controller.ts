import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
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

import { CreatePersonalSetlistDto } from './dto/create-personal-setlist.dto';
import { SharePersonalSetlistDto } from './dto/share-personal-setlist.dto';
import { SetlistsService } from './setlists.service';

const APP_THROTTLE = { default: { limit: 60, ttl: 60_000 } } as const;

@Controller({
  path: 'app/setlists/personal',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SetlistsController {
  constructor(private readonly setlistsService: SetlistsService) {}

  private buildMeta(req: Request, ipFromDecorator?: string) {
    return {
      requestId: resolveRequestId(req),
      ipAddress: ipFromDecorator ?? (typeof req.ip === 'string' ? req.ip : undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_MANAGE)
  listMine(@CurrentUser('sub') userId: string) {
    return this.setlistsService.listMyPersonalSetlists(userId);
  }

  @Post()
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_MANAGE)
  create(
    @CurrentUser('sub') userId: string,
    @Body() body: CreatePersonalSetlistDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.setlistsService.createPersonalSetlist(userId, body, this.buildMeta(req, ip));
  }

  @Post(':id/share')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_SHARE)
  share(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SharePersonalSetlistDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.setlistsService.enableSharingPersonalSetlist(
      userId,
      id,
      body,
      this.buildMeta(req, ip),
    );
  }
}
