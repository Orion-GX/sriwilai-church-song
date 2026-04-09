import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchEntity } from '../churches/entities/church.entity';
import { UserEntity } from '../users/entities/user.entity';

import { SongCategoryEntity } from './entities/song-category.entity';
import { SongTagEntity } from './entities/song-tag.entity';
import { SongEntity } from './entities/song.entity';
import { SongContentNormalizerService } from './song-content-normalizer.service';
import { SongsAdminController } from './songs-admin.controller';
import { SongsAdminService } from './songs-admin.service';
import { SongsPublicController } from './songs-public.controller';
import { SongsPublicService } from './songs-public.service';
import { SongsService } from './songs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SongEntity,
      SongCategoryEntity,
      SongTagEntity,
      ChurchEntity,
      UserEntity,
    ]),
  ],
  controllers: [SongsPublicController, SongsAdminController],
  providers: [SongsService, SongsPublicService, SongsAdminService, SongContentNormalizerService],
  exports: [SongsService],
})
export class SongsModule {}
