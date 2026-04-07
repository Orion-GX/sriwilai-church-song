import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../auth/decorators/public.decorator';

import { ListPublicSongsQueryDto } from './dto/list-songs-query.dto';
import { SongsPublicService } from './songs-public.service';

const APP_THROTTLE = { default: { limit: 120, ttl: 60_000 } } as const;

@Public()
@Controller({
  path: 'app/songs',
  version: '1',
})
export class SongsPublicController {
  constructor(private readonly songsPublicService: SongsPublicService) {}

  @Get()
  @Throttle(APP_THROTTLE)
  list(@Query() query: ListPublicSongsQueryDto) {
    return this.songsPublicService.listSongs(query);
  }

  @Get('categories')
  @Throttle(APP_THROTTLE)
  listCategories() {
    return this.songsPublicService.listCategories();
  }

  @Get('tags')
  @Throttle(APP_THROTTLE)
  listTags() {
    return this.songsPublicService.listTags();
  }

  @Get(':id')
  @Throttle(APP_THROTTLE)
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.songsPublicService.getSongDetail(id);
  }
}
