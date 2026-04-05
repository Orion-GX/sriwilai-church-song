import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { AuditLogService } from '../audit/audit-log.service';
import { RbacService } from '../rbac/rbac.service';
import { SYSTEM_PERMISSION_CODES } from '../rbac/rbac.constants';

import { SONG_AUDIT_ACTIONS } from './constants/audit-actions';
import { CreateSongDto } from './dto/create-song.dto';
import { ListSongsQueryDto } from './dto/list-songs-query.dto';
import { CreateSongCategoryDto, UpdateSongCategoryDto } from './dto/song-category.dto';
import {
  SongCategoryResponseDto,
  SongDetailDto,
  SongListItemDto,
  SongTagResponseDto,
} from './dto/song-response.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongCategoryEntity } from './entities/song-category.entity';
import { SongTagEntity } from './entities/song-tag.entity';
import { SongEntity } from './entities/song.entity';
import { SongRequestMeta } from './types/song-request-meta.type';

export interface PaginatedSongsDto {
  items: SongListItemDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(SongEntity)
    private readonly songRepo: Repository<SongEntity>,
    @InjectRepository(SongCategoryEntity)
    private readonly categoryRepo: Repository<SongCategoryEntity>,
    @InjectRepository(SongTagEntity)
    private readonly tagRepo: Repository<SongTagEntity>,
    private readonly rbacService: RbacService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listPublic(query: ListSongsQueryDto): Promise<PaginatedSongsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const totalRow = await this.buildPublicListQuery(query)
      .select('COUNT(DISTINCT s.id)', 'cnt')
      .getRawOne<{ cnt: string }>();
    const total = Number(totalRow?.cnt ?? 0);

    const rows = await this.buildPublicListQuery(query)
      .orderBy('s.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: rows.map((r) => SongListItemDto.fromEntity(r)),
      total,
      page,
      limit,
    };
  }

  async findOnePublic(id: string): Promise<SongDetailDto> {
    const row = await this.songRepo.findOne({
      where: {
        id,
        isPublished: true,
        deletedAt: IsNull(),
      },
      relations: { category: true, tags: true },
    });
    if (!row) {
      throw new NotFoundException('Song not found');
    }
    await this.songRepo.increment({ id: row.id }, 'viewCount', 1);
    const viewCountAfter = (row.viewCount ?? 0) + 1;
    return SongDetailDto.fromEntity(row, { viewCount: viewCountAfter });
  }

  async listCategoriesPublic(): Promise<SongCategoryResponseDto[]> {
    const rows = await this.categoryRepo.find({
      where: { deletedAt: IsNull() },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((r) => SongCategoryResponseDto.fromEntity(r));
  }

  async listTagsPublic(): Promise<SongTagResponseDto[]> {
    const rows = await this.tagRepo
      .createQueryBuilder('t')
      .innerJoin('t.songs', 's')
      .where('t.deleted_at IS NULL')
      .andWhere('s.deleted_at IS NULL')
      .andWhere('s.is_published = TRUE')
      .distinct(true)
      .orderBy('t.name', 'ASC')
      .getMany();
    return rows.map((r) => SongTagResponseDto.fromEntity(r));
  }

  async createSong(
    actorUserId: string,
    scopeChurchId: string | null,
    dto: CreateSongDto,
    meta?: SongRequestMeta,
  ): Promise<SongDetailDto> {
    const ok = await this.rbacService.userHasAllPermissions(
      actorUserId,
      [SYSTEM_PERMISSION_CODES.SONG_CREATE],
      scopeChurchId,
    );
    if (!ok) {
      throw new ForbiddenException('Insufficient permission');
    }

    if (dto.categoryId) {
      await this.getActiveCategoryOrThrow(dto.categoryId);
    }

    const baseSlug = dto.slug ?? this.slugify(dto.title, 180);
    const slug = await this.ensureUniqueSongSlug(baseSlug, scopeChurchId);

    const tags = await this.resolveTagEntities(dto.tagSlugs ?? []);

    const created = this.songRepo.create({
      churchId: scopeChurchId,
      title: dto.title,
      slug,
      chordproBody: dto.chordproBody,
      categoryId: dto.categoryId ?? null,
      isPublished: dto.isPublished ?? true,
      createdBy: actorUserId,
      updatedBy: actorUserId,
      deletedAt: null,
    });
    let saved = await this.songRepo.save(created);
    if (tags.length > 0) {
      saved.tags = tags;
      saved = await this.songRepo.save(saved);
    }

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: SONG_AUDIT_ACTIONS.CREATE,
      resourceType: 'song',
      resourceId: saved.id,
      scopeChurchId: saved.churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: null,
      afterData: {
        title: saved.title,
        slug: saved.slug,
        churchId: saved.churchId,
        categoryId: saved.categoryId,
        tagSlugs: tags.map((t) => t.slug),
        isPublished: saved.isPublished,
      },
    });

    return this.findOneAuthoring(saved.id);
  }

  async updateSong(
    actorUserId: string,
    id: string,
    dto: UpdateSongDto,
    meta?: SongRequestMeta,
  ): Promise<SongDetailDto> {
    const song = await this.songRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { category: true, tags: true },
    });
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    await this.assertSongMutation(actorUserId, song, SYSTEM_PERMISSION_CODES.SONG_UPDATE);

    const before = this.snapshotSongAudit(song);

    if (dto.title !== undefined) {
      song.title = dto.title;
    }
    if (dto.chordproBody !== undefined) {
      song.chordproBody = dto.chordproBody;
    }
    if (dto.slug !== undefined) {
      song.slug = await this.ensureUniqueSongSlug(dto.slug, song.churchId, song.id);
    }
    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        song.categoryId = null;
      } else {
        await this.getActiveCategoryOrThrow(dto.categoryId);
        song.categoryId = dto.categoryId;
      }
    }
    if (dto.tagSlugs !== undefined) {
      song.tags = await this.resolveTagEntities(dto.tagSlugs);
    }
    if (dto.isPublished !== undefined) {
      song.isPublished = dto.isPublished;
    }

    song.updatedBy = actorUserId;
    const saved = await this.songRepo.save(song);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: SONG_AUDIT_ACTIONS.UPDATE,
      resourceType: 'song',
      resourceId: saved.id,
      scopeChurchId: saved.churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: this.snapshotSongAudit(saved),
    });

    return this.findOneAuthoring(saved.id);
  }

  async softDeleteSong(actorUserId: string, id: string, meta?: SongRequestMeta): Promise<void> {
    const song = await this.songRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { tags: true },
    });
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    await this.assertSongMutation(actorUserId, song, SYSTEM_PERMISSION_CODES.SONG_DELETE);

    const before = this.snapshotSongAudit(song);
    song.deletedAt = new Date();
    song.updatedBy = actorUserId;
    await this.songRepo.save(song);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: SONG_AUDIT_ACTIONS.DELETE,
      resourceType: 'song',
      resourceId: id,
      scopeChurchId: song.churchId,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: { deleted: true },
    });
  }

  async createCategory(
    actorUserId: string,
    dto: CreateSongCategoryDto,
    meta?: SongRequestMeta,
  ): Promise<SongCategoryResponseDto> {
    await this.assertGlobalMetadataAdmin(actorUserId);
    const slug = dto.slug ?? this.slugify(dto.name, 80);
    await this.assertCategorySlugAvailable(slug);

    const row = await this.categoryRepo.save(
      this.categoryRepo.create({
        slug,
        name: dto.name,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 0,
        deletedAt: null,
      }),
    );

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: SONG_AUDIT_ACTIONS.CATEGORY_CREATE,
      resourceType: 'song_category',
      resourceId: row.id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: null,
      afterData: { slug: row.slug, name: row.name },
    });

    return SongCategoryResponseDto.fromEntity(row);
  }

  async updateCategory(
    actorUserId: string,
    id: string,
    dto: UpdateSongCategoryDto,
    meta?: SongRequestMeta,
  ): Promise<SongCategoryResponseDto> {
    await this.assertGlobalMetadataAdmin(actorUserId);
    if (
      dto.name === undefined &&
      dto.slug === undefined &&
      dto.description === undefined &&
      dto.sortOrder === undefined
    ) {
      throw new BadRequestException('No changes provided');
    }

    const row = await this.categoryRepo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!row) {
      throw new NotFoundException('Category not found');
    }
    const before = { slug: row.slug, name: row.name };

    if (dto.name !== undefined) {
      row.name = dto.name;
    }
    if (dto.slug !== undefined && dto.slug !== row.slug) {
      await this.assertCategorySlugAvailable(dto.slug, row.id);
      row.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      row.description = dto.description;
    }
    if (dto.sortOrder !== undefined) {
      row.sortOrder = dto.sortOrder;
    }

    const saved = await this.categoryRepo.save(row);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: SONG_AUDIT_ACTIONS.CATEGORY_UPDATE,
      resourceType: 'song_category',
      resourceId: saved.id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: { slug: saved.slug, name: saved.name },
    });

    return SongCategoryResponseDto.fromEntity(saved);
  }

  async softDeleteCategory(actorUserId: string, id: string, meta?: SongRequestMeta): Promise<void> {
    await this.assertGlobalMetadataAdmin(actorUserId);
    const row = await this.categoryRepo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!row) {
      throw new NotFoundException('Category not found');
    }
    const before = { slug: row.slug, name: row.name };

    await this.songRepo
      .createQueryBuilder()
      .update(SongEntity)
      .set({ categoryId: null })
      .where('category_id = :cid', { cid: id })
      .andWhere('deleted_at IS NULL')
      .execute();

    row.deletedAt = new Date();
    await this.categoryRepo.save(row);

    await this.auditLogService.log({
      actorUserId,
      actorType: 'user',
      action: SONG_AUDIT_ACTIONS.CATEGORY_DELETE,
      resourceType: 'song_category',
      resourceId: id,
      requestId: meta?.requestId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      beforeData: before,
      afterData: { deleted: true },
    });
  }

  private buildPublicListQuery(query: ListSongsQueryDto) {
    const qb = this.songRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.category', 'category', 'category.deleted_at IS NULL')
      .leftJoinAndSelect('s.tags', 'tags', 'tags.deleted_at IS NULL')
      .where('s.deleted_at IS NULL')
      .andWhere('s.is_published = TRUE');

    if (query.churchId) {
      qb.andWhere('s.church_id = :churchId', { churchId: query.churchId });
    }

    if (query.categorySlug) {
      qb.andWhere('category.id IS NOT NULL AND category.slug = :catSlug', {
        catSlug: query.categorySlug,
      });
    }

    if (query.q?.trim()) {
      qb.andWhere('s.title ILIKE :q', { q: `%${query.q.trim()}%` });
    }

    if (query.tagSlugs?.length) {
      for (let i = 0; i < query.tagSlugs.length; i += 1) {
        const ph = `tagSlug_${i}`;
        qb.andWhere(
          `EXISTS (
            SELECT 1 FROM song_song_tags sst
            INNER JOIN song_tags st ON st.id = sst.tag_id
            AND st.slug = :${ph}
            AND st.deleted_at IS NULL
            WHERE sst.song_id = s.id
          )`,
          { [ph]: query.tagSlugs[i] },
        );
      }
    }

    return qb;
  }

  private async findOneAuthoring(id: string): Promise<SongDetailDto> {
    const row = await this.songRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { category: true, tags: true },
    });
    if (!row) {
      throw new NotFoundException('Song not found');
    }
    return SongDetailDto.fromEntity(row);
  }

  private async assertSongMutation(userId: string, song: SongEntity, permission: string): Promise<void> {
    const ok = await this.rbacService.userHasAllPermissions(userId, [permission], song.churchId);
    if (!ok) {
      throw new NotFoundException('Song not found');
    }
  }

  private async assertGlobalMetadataAdmin(userId: string): Promise<void> {
    const ok = await this.rbacService.userHasAllPermissions(
      userId,
      [SYSTEM_PERMISSION_CODES.SONG_UPDATE],
      null,
    );
    if (!ok) {
      throw new ForbiddenException('Insufficient permission');
    }
  }

  private async getActiveCategoryOrThrow(id: string): Promise<SongCategoryEntity> {
    const row = await this.categoryRepo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!row) {
      throw new BadRequestException('Invalid category');
    }
    return row;
  }

  private async assertCategorySlugAvailable(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.categoryRepo.findOne({
      where: {
        slug,
        deletedAt: IsNull(),
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Category slug already in use');
    }
  }

  private snapshotSongAudit(song: SongEntity): Record<string, unknown> {
    return {
      title: song.title,
      slug: song.slug,
      churchId: song.churchId,
      categoryId: song.categoryId,
      tagSlugs: (song.tags ?? []).map((t) => t.slug),
      isPublished: song.isPublished,
    };
  }

  private slugify(input: string, maxLen: number): string {
    const base = input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, maxLen);
    return base.length > 0 ? base : 'song';
  }

  private async ensureUniqueSongSlug(
    desired: string,
    churchId: string | null,
    excludeSongId?: string,
  ): Promise<string> {
    let candidate = desired.slice(0, 180);
    for (let i = 0; i < 25; i += 1) {
      const existing = await this.songRepo.findOne({
        where: {
          slug: candidate,
          churchId: churchId === null ? IsNull() : churchId,
          deletedAt: IsNull(),
          ...(excludeSongId ? { id: Not(excludeSongId) } : {}),
        },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
      const suffix = `${Date.now().toString(36)}${i}`.slice(-6);
      candidate = `${desired.slice(0, 170)}-${suffix}`.slice(0, 180);
    }
    throw new BadRequestException('Could not allocate a unique slug');
  }

  private async resolveTagEntities(slugs: string[]): Promise<SongTagEntity[]> {
    const normalized = [...new Set(slugs.map((s) => this.normalizeTagSlug(s)).filter(Boolean))];
    const out: SongTagEntity[] = [];
    for (const slug of normalized) {
      let tag = await this.tagRepo.findOne({ where: { slug, deletedAt: IsNull() } });
      if (!tag) {
        const name = slug.replace(/-/g, ' ');
        tag = await this.tagRepo.save(
          this.tagRepo.create({
            slug,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            deletedAt: null,
          }),
        );
      }
      out.push(tag);
    }
    return out;
  }

  private normalizeTagSlug(raw: string): string {
    const s = this.slugify(raw, 80);
    return s || 'tag';
  }
}
