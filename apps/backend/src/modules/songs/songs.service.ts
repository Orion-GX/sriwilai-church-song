import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { AuditLogService } from '../audit/audit-log.service';
import { SONG_VISIBILITY, SYSTEM_PERMISSION_CODES } from '../rbac/rbac.constants';
import { RbacService } from '../rbac/rbac.service';

import { SONG_AUDIT_ACTIONS } from './constants/audit-actions';
import { CreateSongDto } from './dto/create-song.dto';
import { ListAdminSongsQueryDto } from './dto/list-admin-songs-query.dto';
import { ListPublicSongsQueryDto } from './dto/list-songs-query.dto';
import { CreateSongCategoryDto, UpdateSongCategoryDto } from './dto/song-category.dto';
import {
  SongAdminDetailDto,
  SongAdminListItemDto,
  SongCategoryResponseDto,
  SongPublicDetailDto,
  SongPublicListItemDto,
  SongTagResponseDto,
} from './dto/song-response.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongCategoryEntity } from './entities/song-category.entity';
import { SongTagEntity } from './entities/song-tag.entity';
import { SongEntity } from './entities/song.entity';
import { SongContentNormalizerService } from './song-content-normalizer.service';
import { SongRequestMeta } from './types/song-request-meta.type';

export interface PaginatedSongsDto {
  items: SongPublicListItemDto[] | SongAdminListItemDto[];
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
    private readonly songContentNormalizer: SongContentNormalizerService,
  ) {}

  async listPublicSongs(query: ListPublicSongsQueryDto): Promise<PaginatedSongsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const totalRow = await this.buildPublicListQuery(query)
      .select('COUNT(DISTINCT s.id)', 'cnt')
      .getRawOne<{ cnt: string }>();
    const total = Number(totalRow?.cnt ?? 0);

    const rows = await this.buildPublicListQuery(query)
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: rows.map((r) => SongPublicListItemDto.fromEntity(r)),
      total,
      page,
      limit,
    };
  }

  async listAdminSongs(query: ListAdminSongsQueryDto): Promise<PaginatedSongsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';
    const orderByColumn =
      sortBy === 'title' ? 's.title' : sortBy === 'viewCount' ? 's.viewCount' : 's.createdAt';

    const totalRow = await this.buildAdminListQuery(query)
      .select('COUNT(DISTINCT s.id)', 'cnt')
      .getRawOne<{ cnt: string }>();
    const total = Number(totalRow?.cnt ?? 0);

    const rows = await this.buildAdminListQuery(query)
      .orderBy(orderByColumn, sortOrder)
      .addOrderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: rows.map((r) => SongAdminListItemDto.fromEntity(r)),
      total,
      page,
      limit,
    };
  }

  async findOnePublicSong(id: string): Promise<SongPublicDetailDto> {
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
    return SongPublicDetailDto.fromEntity(row, { viewCount: viewCountAfter });
  }

  async findOneAdminSong(id: string): Promise<SongAdminDetailDto> {
    const row = await this.songRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { category: true, tags: true },
    });
    if (!row) {
      throw new NotFoundException('Song not found');
    }
    return SongAdminDetailDto.fromEntity(row);
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
  ): Promise<SongAdminDetailDto> {
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

    const baseCode = dto.code ?? this.codeify(dto.title, 180);
    const code = await this.ensureUniqueSongCode(baseCode, scopeChurchId);

    const tags = await this.resolveTagEntities(dto.tagCodes ?? []);

    const contentJson =
      dto.contentJson !== undefined
        ? this.songContentNormalizer.validateContentJson(dto.contentJson)
        : dto.rawText
          ? this.songContentNormalizer.importThreeLineBlock(dto.rawText)
          : null;

    const created = this.songRepo.create({
      churchId: scopeChurchId,
      visibility: scopeChurchId ? SONG_VISIBILITY.CHURCH : SONG_VISIBILITY.PUBLIC,
      title: dto.title,
      code,
      chordproBody: dto.chordproBody,
      contentJson,
      originalKey: dto.originalKey ?? null,
      tempo: dto.tempo ?? null,
      timeSignature: dto.timeSignature ?? null,
      coverImageUrl: dto.coverImageUrl ?? null,
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
        code: saved.code,
        churchId: saved.churchId,
        visibility: saved.visibility,
        contentJson: saved.contentJson,
        originalKey: saved.originalKey,
        tempo: saved.tempo,
        timeSignature: saved.timeSignature,
        coverImageUrl: saved.coverImageUrl,
        categoryId: saved.categoryId,
        tagCodes: tags.map((t) => t.code),
        isPublished: saved.isPublished,
      },
    });

    return this.findOneAdminAuthoring(saved.id);
  }

  async updateSong(
    actorUserId: string,
    id: string,
    dto: UpdateSongDto,
    meta?: SongRequestMeta,
  ): Promise<SongAdminDetailDto> {
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
    if (dto.code !== undefined) {
      song.code = await this.ensureUniqueSongCode(dto.code, song.churchId, song.id);
    }
    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        song.categoryId = null;
      } else {
        await this.getActiveCategoryOrThrow(dto.categoryId);
        song.categoryId = dto.categoryId;
      }
    }
    if (dto.tagCodes !== undefined) {
      song.tags = await this.resolveTagEntities(dto.tagCodes);
    }
    if (dto.isPublished !== undefined) {
      song.isPublished = dto.isPublished;
    }
    if (dto.contentJson !== undefined) {
      song.contentJson =
        dto.contentJson === null
          ? null
          : this.songContentNormalizer.validateContentJson(dto.contentJson);
    } else if (dto.rawText !== undefined) {
      song.contentJson =
        dto.rawText === null ? null : this.songContentNormalizer.importThreeLineBlock(dto.rawText);
    }
    if (dto.originalKey !== undefined) {
      song.originalKey = dto.originalKey;
    }
    if (dto.tempo !== undefined) {
      song.tempo = dto.tempo;
    }
    if (dto.timeSignature !== undefined) {
      song.timeSignature = dto.timeSignature;
    }
    if (dto.coverImageUrl !== undefined) {
      song.coverImageUrl = dto.coverImageUrl;
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

    return this.findOneAdminAuthoring(saved.id);
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
    const code = dto.code ?? this.codeify(dto.name, 80);
    await this.assertCategoryCodeAvailable(code);

    const row = await this.categoryRepo.save(
      this.categoryRepo.create({
        code,
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
      afterData: { code: row.code, name: row.name },
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
      dto.code === undefined &&
      dto.description === undefined &&
      dto.sortOrder === undefined
    ) {
      throw new BadRequestException('No changes provided');
    }

    const row = await this.categoryRepo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!row) {
      throw new NotFoundException('Category not found');
    }
    const before = { code: row.code, name: row.name };

    if (dto.name !== undefined) {
      row.name = dto.name;
    }
    if (dto.code !== undefined && dto.code !== row.code) {
      await this.assertCategoryCodeAvailable(dto.code, row.id);
      row.code = dto.code;
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
      afterData: { code: saved.code, name: saved.name },
    });

    return SongCategoryResponseDto.fromEntity(saved);
  }

  async softDeleteCategory(actorUserId: string, id: string, meta?: SongRequestMeta): Promise<void> {
    await this.assertGlobalMetadataAdmin(actorUserId);
    const row = await this.categoryRepo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!row) {
      throw new NotFoundException('Category not found');
    }
    const before = { code: row.code, name: row.name };

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

  private buildPublicListQuery(query: ListPublicSongsQueryDto) {
    const junctionTable = this.qualifiedTableName('song_song_tags');
    const tagsTable = this.qualifiedTableName('song_tags');
    const qb = this.songRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.category', 'category', 'category.deleted_at IS NULL')
      .leftJoinAndSelect('s.tags', 'tags', 'tags.deleted_at IS NULL')
      .where('s.deleted_at IS NULL')
      .andWhere('s.is_published = TRUE');

    if (query.churchId) {
      qb.andWhere(
        '(s.visibility = :publicVisibility OR (s.visibility = :churchVisibility AND s.church_id = :churchId))',
        {
          publicVisibility: SONG_VISIBILITY.PUBLIC,
          churchVisibility: SONG_VISIBILITY.CHURCH,
          churchId: query.churchId,
        },
      );
    } else {
      qb.andWhere('s.visibility = :publicVisibility', { publicVisibility: SONG_VISIBILITY.PUBLIC });
    }

    if (query.categoryCode) {
      qb.andWhere('category.id IS NOT NULL AND category.code = :catCode', {
        catCode: query.categoryCode,
      });
    }

    if (query.q?.trim()) {
      qb.andWhere('s.title ILIKE :q', { q: `%${query.q.trim()}%` });
    }

    if (query.tagCodes?.length) {
      for (let i = 0; i < query.tagCodes.length; i += 1) {
        const ph = `tagCode_${i}`;
        qb.andWhere(
          `EXISTS (
            SELECT 1 FROM ${junctionTable} sst
            INNER JOIN ${tagsTable} st ON st.id = sst.tag_id
            AND st.code = :${ph}
            AND st.deleted_at IS NULL
            WHERE sst.song_id = s.id
          )`,
          { [ph]: query.tagCodes[i] },
        );
      }
    }

    return qb;
  }

  private buildAdminListQuery(query: ListAdminSongsQueryDto) {
    const junctionTable = this.qualifiedTableName('song_song_tags');
    const tagsTable = this.qualifiedTableName('song_tags');
    const qb = this.songRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.category', 'category', 'category.deleted_at IS NULL')
      .leftJoinAndSelect('s.tags', 'tags', 'tags.deleted_at IS NULL')
      .where('s.deleted_at IS NULL');

    if (query.churchId) {
      qb.andWhere('s.church_id = :churchId', { churchId: query.churchId });
    }

    if (query.categoryCode) {
      qb.andWhere('category.id IS NOT NULL AND category.code = :catCode', {
        catCode: query.categoryCode,
      });
    }

    if (query.q?.trim()) {
      qb.andWhere('s.title ILIKE :q', { q: `%${query.q.trim()}%` });
    }

    if (query.isPublished !== undefined) {
      qb.andWhere('s.is_published = :isPublished', { isPublished: query.isPublished });
    }

    if (query.tagCodes?.length) {
      for (let i = 0; i < query.tagCodes.length; i += 1) {
        const ph = `tagCode_${i}`;
        qb.andWhere(
          `EXISTS (
            SELECT 1 FROM ${junctionTable} sst
            INNER JOIN ${tagsTable} st ON st.id = sst.tag_id
            AND st.code = :${ph}
            AND st.deleted_at IS NULL
            WHERE sst.song_id = s.id
          )`,
          { [ph]: query.tagCodes[i] },
        );
      }
    }

    return qb;
  }

  private qualifiedTableName(table: string): string {
    const schema = this.songRepo.metadata.schema;
    if (!schema) {
      return `"${table}"`;
    }
    return `"${schema}"."${table}"`;
  }

  private async findOneAdminAuthoring(id: string): Promise<SongAdminDetailDto> {
    const row = await this.songRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { category: true, tags: true },
    });
    if (!row) {
      throw new NotFoundException('Song not found');
    }
    return SongAdminDetailDto.fromEntity(row);
  }

  private async assertSongMutation(
    userId: string,
    song: SongEntity,
    permission: string,
  ): Promise<void> {
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

  private async assertCategoryCodeAvailable(code: string, excludeId?: string): Promise<void> {
    const existing = await this.categoryRepo.findOne({
      where: {
        code,
        deletedAt: IsNull(),
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Category code already in use');
    }
  }

  private snapshotSongAudit(song: SongEntity): Record<string, unknown> {
    return {
      title: song.title,
      code: song.code,
      churchId: song.churchId,
      visibility: song.visibility,
      contentJson: song.contentJson,
      originalKey: song.originalKey,
      tempo: song.tempo,
      timeSignature: song.timeSignature,
      coverImageUrl: song.coverImageUrl,
      categoryId: song.categoryId,
      tagCodes: (song.tags ?? []).map((t) => t.code),
      isPublished: song.isPublished,
    };
  }

  private codeify(input: string, maxLen: number): string {
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

  private async ensureUniqueSongCode(
    desired: string,
    churchId: string | null,
    excludeSongId?: string,
  ): Promise<string> {
    let candidate = desired.slice(0, 180);
    for (let i = 0; i < 25; i += 1) {
      const existing = await this.songRepo.findOne({
        where: {
          code: candidate,
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
    throw new BadRequestException('Could not allocate a unique code');
  }

  private async resolveTagEntities(codes: string[]): Promise<SongTagEntity[]> {
    const normalized = [...new Set(codes.map((s) => this.normalizeTagCode(s)).filter(Boolean))];
    const out: SongTagEntity[] = [];
    for (const code of normalized) {
      let tag = await this.tagRepo.findOne({ where: { code, deletedAt: IsNull() } });
      if (!tag) {
        const name = code.replace(/-/g, ' ');
        tag = await this.tagRepo.save(
          this.tagRepo.create({
            code,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            deletedAt: null,
          }),
        );
      }
      out.push(tag);
    }
    return out;
  }

  private normalizeTagCode(raw: string): string {
    const s = this.codeify(raw, 80);
    return s || 'tag';
  }
}
