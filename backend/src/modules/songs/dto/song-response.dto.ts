import { SongEntity } from '../entities/song.entity';

export class SongCategorySnippetDto {
  id!: string;
  slug!: string;
  name!: string;
}

export class SongTagSnippetDto {
  id!: string;
  slug!: string;
  name!: string;
}

export class SongListItemDto {
  id!: string;
  title!: string;
  slug!: string;
  churchId!: string | null;
  isPublished!: boolean;
  category!: SongCategorySnippetDto | null;
  tags!: SongTagSnippetDto[];
  viewCount!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongListItemDto {
    const dto = new SongListItemDto();
    dto.id = row.id;
    dto.title = row.title;
    dto.slug = row.slug;
    dto.churchId = row.churchId;
    dto.isPublished = row.isPublished;
    dto.category = row.category
      ? { id: row.category.id, slug: row.category.slug, name: row.category.name }
      : null;
    dto.tags = (row.tags ?? []).map((t) => ({ id: t.id, slug: t.slug, name: t.name }));
    dto.viewCount = opts?.viewCount ?? row.viewCount ?? 0;
    dto.createdAt = row.createdAt;
    dto.updatedAt = row.updatedAt;
    return dto;
  }
}

export class SongDetailDto extends SongListItemDto {
  chordproBody!: string;
  createdBy!: string | null;
  updatedBy!: string | null;

  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongDetailDto {
    const list = SongListItemDto.fromEntity(row, opts);
    const dto = new SongDetailDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.slug = list.slug;
    dto.churchId = list.churchId;
    dto.isPublished = list.isPublished;
    dto.category = list.category;
    dto.tags = list.tags;
    dto.viewCount = list.viewCount;
    dto.createdAt = list.createdAt;
    dto.updatedAt = list.updatedAt;
    dto.chordproBody = row.chordproBody;
    dto.createdBy = row.createdBy;
    dto.updatedBy = row.updatedBy;
    return dto;
  }
}

export class SongCategoryResponseDto {
  id!: string;
  slug!: string;
  name!: string;
  description!: string | null;
  sortOrder!: number;

  static fromEntity(row: import('../entities/song-category.entity').SongCategoryEntity): SongCategoryResponseDto {
    const dto = new SongCategoryResponseDto();
    dto.id = row.id;
    dto.slug = row.slug;
    dto.name = row.name;
    dto.description = row.description;
    dto.sortOrder = row.sortOrder;
    return dto;
  }
}

export class SongTagResponseDto {
  id!: string;
  slug!: string;
  name!: string;

  static fromEntity(row: import('../entities/song-tag.entity').SongTagEntity): SongTagResponseDto {
    const dto = new SongTagResponseDto();
    dto.id = row.id;
    dto.slug = row.slug;
    dto.name = row.name;
    return dto;
  }
}
