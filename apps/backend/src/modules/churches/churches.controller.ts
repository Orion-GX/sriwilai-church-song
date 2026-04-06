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

import { AddChurchMemberDto } from './dto/add-church-member.dto';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';
import { UpdateChurchMemberRoleDto } from './dto/update-church-member-role.dto';
import { ChurchesService } from './churches.service';

const APP_THROTTLE = { default: { limit: 60, ttl: 60_000 } } as const;

@Controller({
  path: 'app/churches',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChurchesController {
  constructor(private readonly churchesService: ChurchesService) {}

  private meta(req: Request, ip?: string) {
    return {
      requestId: resolveRequestId(req),
      ipAddress: ip ?? (typeof req.ip === 'string' ? req.ip : undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Get()
  @Throttle(APP_THROTTLE)
  listMine(@CurrentUser('sub') userId: string) {
    return this.churchesService.listMyChurches(userId);
  }

  @Post()
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.CHURCH_CREATE)
  create(
    @CurrentUser('sub') userId: string,
    @Body() body: CreateChurchDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.churchesService.createChurch(userId, body, this.meta(req, ip));
  }

  @Get(':id/members')
  @Throttle(APP_THROTTLE)
  listMembers(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) churchId: string,
  ) {
    return this.churchesService.listMembers(userId, churchId);
  }

  @Post(':id/members')
  @Throttle(APP_THROTTLE)
  addMember(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) churchId: string,
    @Body() body: AddChurchMemberDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.churchesService.addMember(userId, churchId, body, this.meta(req, ip));
  }

  @Patch(':id/members/:userId')
  @Throttle(APP_THROTTLE)
  updateMemberRole(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) churchId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() body: UpdateChurchMemberRoleDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.churchesService.updateMemberRole(
      actorUserId,
      churchId,
      targetUserId,
      body,
      this.meta(req, ip),
    );
  }

  @Delete(':id/members/:userId')
  @Throttle(APP_THROTTLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) churchId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ): Promise<void> {
    await this.churchesService.removeMember(actorUserId, churchId, targetUserId, this.meta(req, ip));
  }

  @Get(':id')
  @Throttle(APP_THROTTLE)
  findOne(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) churchId: string) {
    return this.churchesService.findOne(userId, churchId);
  }

  @Patch(':id')
  @Throttle(APP_THROTTLE)
  update(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) churchId: string,
    @Body() body: UpdateChurchDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.churchesService.updateChurch(userId, churchId, body, this.meta(req, ip));
  }

  @Delete(':id')
  @Throttle(APP_THROTTLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) churchId: string,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ): Promise<void> {
    await this.churchesService.softDeleteChurch(userId, churchId, this.meta(req, ip));
  }
}
