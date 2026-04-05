import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchEntity } from '../churches/entities/church.entity';
import { UserEntity } from '../users/entities/user.entity';

import { SongCategoryEntity } from './entities/song-category.entity';
import { SongTagEntity } from './entities/song-tag.entity';
import { SongEntity } from './entities/song.entity';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SongEntity, SongCategoryEntity, SongTagEntity, ChurchEntity, UserEntity]),
  ],
  controllers: [SongsController],
  providers: [SongsService],
  exports: [SongsService],
})
export class SongsModule {}
