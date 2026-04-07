import { Injectable } from '@nestjs/common';

import { ListPublicSongsQueryDto } from './dto/list-songs-query.dto';
import { SongsService } from './songs.service';

@Injectable()
export class SongsPublicService {
  constructor(private readonly songsService: SongsService) {}

  listSongs(query: ListPublicSongsQueryDto) {
    return this.songsService.listPublicSongs(query);
  }

  getSongDetail(id: string) {
    return this.songsService.findOnePublicSong(id);
  }

  listCategories() {
    return this.songsService.listCategoriesPublic();
  }

  listTags() {
    return this.songsService.listTagsPublic();
  }
}
