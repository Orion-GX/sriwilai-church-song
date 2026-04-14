import { SongEntity } from '../entities/song.entity';
import { SongContentDocument } from '../types/song-content.type';

export class SongCategorySnippetDto {
  id!: string;
  code!: string;
  name!: string;
}

export class SongTagSnippetDto {
  id!: string;
  code!: string;
  name!: string;
}

export class SongPublicListItemDto {
  id!: string;
  title!: string;
  code!: string;
  churchId!: string | null;
  originalKey!: string | null;
  coverImageUrl!: string | null;
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
    dto.code = row.code;
    dto.churchId = row.churchId;
    dto.originalKey = row.originalKey ?? null;
    dto.coverImageUrl = row.coverImageUrl ?? null;
    dto.visibility = row.visibility;
    dto.isPublished = row.isPublished;
    dto.category = row.category
      ? { id: row.category.id, code: row.category.code, name: row.category.name }
      : null;
    dto.tags = (row.tags ?? []).map((t) => ({ id: t.id, code: t.code, name: t.name }));
    dto.viewCount = opts?.viewCount ?? row.viewCount ?? 0;
    dto.createdAt = row.createdAt;
    dto.updatedAt = row.updatedAt;
    return dto;
  }
}

export class SongPublicDetailDto extends SongPublicListItemDto {
  chordproBody!: string;
  contentJson!: SongContentDocument | null;
  originalKey!: string | null;
  tempo!: number | null;
  timeSignature!: string | null;
  coverImageUrl!: string | null;

  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongPublicDetailDto {
    const list = SongPublicListItemDto.fromEntity(row, opts);
    const dto = new SongPublicDetailDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.code = list.code;
    dto.churchId = list.churchId;
    dto.originalKey = list.originalKey;
    dto.visibility = list.visibility;
    dto.isPublished = list.isPublished;
    dto.category = list.category;
    dto.tags = list.tags;
    dto.viewCount = list.viewCount;
    dto.createdAt = list.createdAt;
    dto.updatedAt = list.updatedAt;
    dto.chordproBody = row.chordproBody;
    dto.contentJson = row.contentJson ?? null;
    dto.originalKey = row.originalKey ?? null;
    dto.tempo = row.tempo ?? null;
    dto.timeSignature = row.timeSignature ?? null;
    dto.coverImageUrl = row.coverImageUrl ?? null;
    return dto;
  }
}

export class SongAdminListItemDto extends SongPublicListItemDto {
  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongAdminListItemDto {
    const list = SongPublicListItemDto.fromEntity(row, opts);
    const dto = new SongAdminListItemDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.code = list.code;
    dto.churchId = list.churchId;
    dto.originalKey = list.originalKey;
    dto.visibility = list.visibility;
    dto.isPublished = list.isPublished;
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
  contentJson!: SongContentDocument | null;
  originalKey!: string | null;
  tempo!: number | null;
  timeSignature!: string | null;
  coverImageUrl!: string | null;
  createdBy!: string | null;
  updatedBy!: string | null;

  static fromEntity(row: SongEntity, opts?: { viewCount?: number }): SongAdminDetailDto {
    const list = SongAdminListItemDto.fromEntity(row, opts);
    const dto = new SongAdminDetailDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.code = list.code;
    dto.churchId = list.churchId;
    dto.originalKey = list.originalKey;
    dto.isPublished = list.isPublished;
    dto.visibility = list.visibility;
    dto.category = list.category;
    dto.tags = list.tags;
    dto.viewCount = list.viewCount;
    dto.createdAt = list.createdAt;
    dto.updatedAt = list.updatedAt;
    dto.chordproBody = row.chordproBody;
    dto.contentJson = row.contentJson ?? null;
    dto.originalKey = row.originalKey ?? null;
    dto.tempo = row.tempo ?? null;
    dto.timeSignature = row.timeSignature ?? null;
    dto.coverImageUrl = row.coverImageUrl ?? null;
    dto.createdBy = row.createdBy;
    dto.updatedBy = row.updatedBy;
    return dto;
  }
}

// Backward compatible aliases for existing consumers.
export { SongAdminDetailDto as SongDetailDto, SongPublicListItemDto as SongListItemDto };

export class SongCategoryResponseDto {
  id!: string;
  code!: string;
  name!: string;
  description!: string | null;
  sortOrder!: number;

  static fromEntity(
    row: import('../entities/song-category.entity').SongCategoryEntity,
  ): SongCategoryResponseDto {
    const dto = new SongCategoryResponseDto();
    dto.id = row.id;
    dto.code = row.code;
    dto.name = row.name;
    dto.description = row.description;
    dto.sortOrder = row.sortOrder;
    return dto;
  }
}

export class SongTagResponseDto {
  id!: string;
  code!: string;
  name!: string;

  static fromEntity(row: import('../entities/song-tag.entity').SongTagEntity): SongTagResponseDto {
    const dto = new SongTagResponseDto();
    dto.id = row.id;
    dto.code = row.code;
    dto.name = row.name;
    return dto;
  }
}
