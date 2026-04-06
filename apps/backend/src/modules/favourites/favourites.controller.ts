import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

import { AddFavouriteDto } from './dto/add-favourite.dto';
import { ListFavouritesQueryDto } from './dto/list-favourites-query.dto';
import { FavouritesService } from './favourites.service';

const APP_THROTTLE = { default: { limit: 120, ttl: 60_000 } } as const;

@Controller({
  path: 'app/favourites',
  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Get()
  @Throttle(APP_THROTTLE)
  list(@CurrentUser('sub') userId: string, @Query() query: ListFavouritesQueryDto) {
    return this.favouritesService.list(userId, query);
  }

  @Post()
  @Throttle(APP_THROTTLE)
  async add(
    @CurrentUser('sub') userId: string,
    @Body() body: AddFavouriteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.favouritesService.add(userId, body.songId);
    res.status(result.duplicate ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }

  @Delete(':songId')
  @Throttle(APP_THROTTLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('sub') userId: string, @Param('songId', ParseUUIDPipe) songId: string): Promise<void> {
    return this.favouritesService.remove(userId, songId);
  }
}
