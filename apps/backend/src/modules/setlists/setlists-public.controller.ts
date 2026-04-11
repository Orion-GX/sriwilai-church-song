import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../auth/decorators/public.decorator';

import { SetlistsService } from './setlists.service';

const PUBLIC_THROTTLE = { default: { limit: 120, ttl: 60_000 } } as const;

@Public()
@Controller({
  path: 'app/setlists/public',
  version: '1',
})
export class SetlistsPublicController {
  constructor(private readonly setlistsService: SetlistsService) {}

  @Get(':slug')
  @Throttle(PUBLIC_THROTTLE)
  getByPublicSlug(@Param('slug') slug: string) {
    return this.setlistsService.getPublicSetlistBySlug(slug);
  }
}
