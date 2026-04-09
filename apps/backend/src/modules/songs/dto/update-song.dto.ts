import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { SongContentDocument } from '../types/song-content.type';

export class UpdateSongDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500_000)
  chordproBody?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @ValidateIf((_: unknown, v: unknown) => v !== null && v !== undefined)
  @IsUUID('4')
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  tagSlugs?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @ValidateIf((_: unknown, v: unknown) => v !== null && v !== undefined)
  @IsObject()
  contentJson?: SongContentDocument | null;

  @IsOptional()
  @ValidateIf((_: unknown, v: unknown) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(500_000)
  rawText?: string | null;

  @IsOptional()
  @ValidateIf((_: unknown, v: unknown) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(24)
  originalKey?: string | null;

  @IsOptional()
  @ValidateIf((_: unknown, v: unknown) => v !== null && v !== undefined)
  @IsInt()
  @Min(20)
  @Max(360)
  tempo?: number | null;

  @IsOptional()
  @ValidateIf((_: unknown, v: unknown) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(16)
  timeSignature?: string | null;
}
