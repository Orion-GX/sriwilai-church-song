import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
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
import { CHURCH_ID_HEADER, SYSTEM_PERMISSION_CODES } from '../rbac/rbac.constants';

import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { ListLiveSessionsQueryDto } from './dto/list-live-sessions-query.dto';
import { LiveService } from './live.service';

const APP_THROTTLE = { default: { limit: 60, ttl: 60_000 } } as const;

function parseChurchIdHeader(req: Request): string | null {
  const raw = req.headers[CHURCH_ID_HEADER];
  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  const v = raw.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) {
    return null;
  }
  return v;
}

@Controller({
  path: 'app/live/sessions',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  private meta(req: Request, ip?: string) {
    return {
      requestId: resolveRequestId(req),
      ipAddress: ip ?? (typeof req.ip === 'string' ? req.ip : undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Post()
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.LIVE_MANAGE)
  create(
    @CurrentUser('sub') userId: string,
    @Body() body: CreateLiveSessionDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    const churchId = parseChurchIdHeader(req);
    return this.liveService.createSession(userId, churchId, body, this.meta(req, ip));
  }

  @Get()
  @Throttle(APP_THROTTLE)
  list(@CurrentUser('sub') userId: string, @Query() query: ListLiveSessionsQueryDto) {
    return this.liveService.listActiveSessions(userId, query.churchId);
  }

  @Get(':id')
  @Throttle(APP_THROTTLE)
  getOne(@CurrentUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.liveService.getSessionStateForApi(userId, id);
  }

  @Post(':id/end')
  @Throttle(APP_THROTTLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async end(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ): Promise<void> {
    await this.liveService.endSession(userId, id, this.meta(req, ip));
  }
}
