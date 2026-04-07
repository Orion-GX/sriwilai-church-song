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

export class SongPublicListItemDto {
  id!: string;
  title!: string;
  slug!: string;
  churchId!: string | null;
  visibility!: SongEntity['visibility'];
  isPublished!: boolean;
  category!: SongCategorySnippetDto | null;
  tags!: SongTagSnippetDto[];
  viewCount!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongPublicListItemDto {
    const dto = new SongPublicListItemDto();
    dto.id = row.id;
    dto.title = row.title;
    dto.slug = row.slug;
    dto.churchId = row.churchId;
    dto.visibility = row.visibility;
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

export class SongPublicDetailDto extends SongPublicListItemDto {
  chordproBody!: string;

  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongPublicDetailDto {
    const list = SongPublicListItemDto.fromEntity(row, opts);
    const dto = new SongPublicDetailDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.slug = list.slug;
    dto.churchId = list.churchId;
    dto.visibility = list.visibility;
    dto.isPublished = list.isPublished;
    dto.category = list.category;
    dto.tags = list.tags;
    dto.viewCount = list.viewCount;
    dto.createdAt = list.createdAt;
    dto.updatedAt = list.updatedAt;
    dto.chordproBody = row.chordproBody;
    return dto;
  }
}

export class SongAdminListItemDto extends SongPublicListItemDto {
  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongAdminListItemDto {
    const list = SongPublicListItemDto.fromEntity(row, opts);
    const dto = new SongAdminListItemDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.slug = list.slug;
    dto.churchId = list.churchId;
    dto.visibility = list.visibility;
    dto.category = list.category;
    dto.tags = list.tags;
    dto.viewCount = list.viewCount;
    dto.createdAt = list.createdAt;
    dto.updatedAt = list.updatedAt;
    return dto;
  }
}

export class SongAdminDetailDto extends SongAdminListItemDto {
  chordproBody!: string;
  createdBy!: string | null;
  updatedBy!: string | null;

  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongAdminDetailDto {
    const list = SongAdminListItemDto.fromEntity(row, opts);
    const dto = new SongAdminDetailDto();
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

// Backward compatible aliases for existing consumers.
export { SongPublicListItemDto as SongListItemDto };
export { SongAdminDetailDto as SongDetailDto };

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
