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
} from 'class-validator';
import { SongContentDocument } from '../types/song-content.type';

export class CreateSongDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500_000)
  chordproBody!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  tagSlugs?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsObject()
  contentJson?: SongContentDocument;

  @IsOptional()
  @IsString()
  @MaxLength(500_000)
  rawText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  originalKey?: string;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(360)
  tempo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  timeSignature?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  coverImageUrl?: string;
}
