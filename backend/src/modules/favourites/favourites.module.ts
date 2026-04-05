import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SongEntity } from '../songs/entities/song.entity';

import { UserSongFavoriteEntity } from './entities/user-song-favorite.entity';
import { FavouritesController } from './favourites.controller';
import { FavouritesService } from './favourites.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSongFavoriteEntity, SongEntity])],
  controllers: [FavouritesController],
  providers: [FavouritesService],
})
export class FavouritesModule {}
