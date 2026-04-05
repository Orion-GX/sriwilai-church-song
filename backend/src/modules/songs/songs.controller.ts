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

import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { resolveRequestId } from '../auth/utils/request-id.util';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CHURCH_ID_HEADER, SYSTEM_PERMISSION_CODES } from '../rbac/rbac.constants';

import { CreateSongDto } from './dto/create-song.dto';
import { ListSongsQueryDto } from './dto/list-songs-query.dto';
import { CreateSongCategoryDto, UpdateSongCategoryDto } from './dto/song-category.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongsService } from './songs.service';

const APP_THROTTLE = { default: { limit: 120, ttl: 60_000 } } as const;

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
  path: 'app/songs',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  private meta(req: Request, ip?: string) {
    return {
      requestId: resolveRequestId(req),
      ipAddress: ip ?? (typeof req.ip === 'string' ? req.ip : undefined),
      userAgent: req.headers['user-agent'],
    };
  }

  @Public()
  @Get()
  @Throttle(APP_THROTTLE)
  list(@Query() query: ListSongsQueryDto) {
    return this.songsService.listPublic(query);
  }

  @Public()
  @Get('categories')
  @Throttle(APP_THROTTLE)
  listCategories() {
    return this.songsService.listCategoriesPublic();
  }

  @Public()
  @Get('tags')
  @Throttle(APP_THROTTLE)
  listTags() {
    return this.songsService.listTagsPublic();
  }

  @Post('categories')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SONG_UPDATE)
  createCategory(
    @CurrentUser('sub') userId: string,
    @Body() body: CreateSongCategoryDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.songsService.createCategory(userId, body, this.meta(req, ip));
  }

  @Patch('categories/:categoryId')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SONG_UPDATE)
  updateCategory(
    @CurrentUser('sub') userId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() body: UpdateSongCategoryDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.songsService.updateCategory(userId, categoryId, body, this.meta(req, ip));
  }

  @Delete('categories/:categoryId')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SONG_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @CurrentUser('sub') userId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ): Promise<void> {
    await this.songsService.softDeleteCategory(userId, categoryId, this.meta(req, ip));
  }

  @Post()
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SONG_CREATE)
  createSong(
    @CurrentUser('sub') userId: string,
    @Body() body: CreateSongDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    const scopeChurchId = parseChurchIdHeader(req);
    return this.songsService.createSong(userId, scopeChurchId, body, this.meta(req, ip));
  }

  @Patch(':id')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SONG_UPDATE)
  updateSong(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSongDto,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ) {
    return this.songsService.updateSong(userId, id, body, this.meta(req, ip));
  }

  @Delete(':id')
  @Throttle(APP_THROTTLE)
  @Permissions(SYSTEM_PERMISSION_CODES.SONG_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSong(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Ip() ip: string | undefined,
  ): Promise<void> {
    await this.songsService.softDeleteSong(userId, id, this.meta(req, ip));
  }

  @Public()
  @Get(':id')
  @Throttle(APP_THROTTLE)
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.songsService.findOnePublic(id);
  }
}
