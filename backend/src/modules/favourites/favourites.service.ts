import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { SongListItemDto } from '../songs/dto/song-response.dto';
import { SongEntity } from '../songs/entities/song.entity';

import { ListFavouritesQueryDto } from './dto/list-favourites-query.dto';
import { UserSongFavoriteEntity } from './entities/user-song-favorite.entity';

export interface AddFavouriteResultDto {
  song: SongListItemDto;
  duplicate: boolean;
}

export interface PaginatedFavouritesDto {
  items: SongListItemDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class FavouritesService {
  constructor(
    @InjectRepository(UserSongFavoriteEntity)
    private readonly favRepo: Repository<UserSongFavoriteEntity>,
    @InjectRepository(SongEntity)
    private readonly songRepo: Repository<SongEntity>,
  ) {}

  async add(userId: string, songId: string): Promise<AddFavouriteResultDto> {
    const song = await this.songRepo.findOne({
      where: { id: songId, deletedAt: IsNull() },
      relations: { category: true, tags: true },
    });
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const existing = await this.favRepo.findOne({ where: { userId, songId } });
    if (existing) {
      return { song: SongListItemDto.fromEntity(song), duplicate: true };
    }

    await this.favRepo.save(this.favRepo.create({ userId, songId }));
    return { song: SongListItemDto.fromEntity(song), duplicate: false };
  }

  async remove(userId: string, songId: string): Promise<void> {
    await this.favRepo.delete({ userId, songId });
  }

  async list(userId: string, query: ListFavouritesQueryDto): Promise<PaginatedFavouritesDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const base = this.favRepo
      .createQueryBuilder('f')
      .innerJoin('f.song', 's')
      .where('f.user_id = :userId', { userId })
      .andWhere('s.deleted_at IS NULL');

    const total = await base.clone().getCount();

    const rows = await base
      .leftJoinAndSelect('f.song', 'song')
      .leftJoinAndSelect('song.category', 'category', 'category.deleted_at IS NULL')
      .leftJoinAndSelect('song.tags', 'tags', 'tags.deleted_at IS NULL')
      .orderBy('f.createdAt', 'DESC')
      .distinct(true)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: rows.map((f) => SongListItemDto.fromEntity(f.song)),
      total,
      page,
      limit,
    };
  }
}
