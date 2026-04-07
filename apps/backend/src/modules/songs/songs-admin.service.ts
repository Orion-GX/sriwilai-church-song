import { Injectable } from '@nestjs/common';

import { ListAdminSongsQueryDto } from './dto/list-admin-songs-query.dto';
import { CreateSongDto } from './dto/create-song.dto';
import { CreateSongCategoryDto, UpdateSongCategoryDto } from './dto/song-category.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongsService } from './songs.service';
import { SongRequestMeta } from './types/song-request-meta.type';

@Injectable()
export class SongsAdminService {
  constructor(private readonly songsService: SongsService) {}

  listSongs(query: ListAdminSongsQueryDto) {
    return this.songsService.listAdminSongs(query);
  }

  getSongDetail(id: string) {
    return this.songsService.findOneAdminSong(id);
  }

  createSong(actorUserId: string, scopeChurchId: string | null, dto: CreateSongDto, meta?: SongRequestMeta) {
    return this.songsService.createSong(actorUserId, scopeChurchId, dto, meta);
  }

  updateSong(actorUserId: string, id: string, dto: UpdateSongDto, meta?: SongRequestMeta) {
    return this.songsService.updateSong(actorUserId, id, dto, meta);
  }

  deleteSong(actorUserId: string, id: string, meta?: SongRequestMeta) {
    return this.songsService.softDeleteSong(actorUserId, id, meta);
  }

  createCategory(actorUserId: string, dto: CreateSongCategoryDto, meta?: SongRequestMeta) {
    return this.songsService.createCategory(actorUserId, dto, meta);
  }

  updateCategory(actorUserId: string, id: string, dto: UpdateSongCategoryDto, meta?: SongRequestMeta) {
    return this.songsService.updateCategory(actorUserId, id, dto, meta);
  }

  deleteCategory(actorUserId: string, id: string, meta?: SongRequestMeta) {
    return this.songsService.softDeleteCategory(actorUserId, id, meta);
  }
}
