import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Patch,
  Param,
  ParseUUIDPipe,
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

import { AddSetlistItemDto } from './dto/add-setlist-item.dto';
import { CreatePersonalSetlistDto } from './dto/create-personal-setlist.dto';
import { ReorderSetlistItemsDto } from './dto/reorder-setlist-items.dto';
import { SharePersonalSetlistDto } from './dto/share-personal-setlist.dto';
import { UpdatePersonalSetlistDto } from './dto/update-personal-setlist.dto';
import { UpdateSetlistItemDto } from './dto/update-setlist-item.dto';
import { UpdateSetlistVisibilityDto } from './dto/update-setlist-visibility.dto';
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

  @Get(':id')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_MANAGE)
  getById(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.setlistsService.getPersonalSetlistById(userId, id);
  }

  @Patch(':id')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_MANAGE)
  patchSetlist(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePersonalSetlistDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.setlistsService.updatePersonalSetlist(userId, id, body, this.buildMeta(req, ip));
  }

  @Patch(':id/reorder')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_MANAGE)
  reorderItems(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReorderSetlistItemsDto,
  ) {
    return this.setlistsService.reorderSetlistItems(userId, id, body);
  }

  @Patch(':id/song-items/:itemId')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_MANAGE)
  patchSongItem(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: UpdateSetlistItemDto,
  ) {
    return this.setlistsService.updateSetlistItem(userId, id, itemId, body);
  }

  @Post(':id/song-items')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_MANAGE)
  addSongItem(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddSetlistItemDto,
  ) {
    return this.setlistsService.addSetlistItem(userId, id, body);
  }

  @Patch(':id/visibility')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_SHARE)
  patchVisibility(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSetlistVisibilityDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.setlistsService.setSetlistVisibility(userId, id, body, this.buildMeta(req, ip));
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

  @Post(':id/public-link')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SETLIST_PERSONAL_SHARE)
  createOrRotatePublicLink(
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
