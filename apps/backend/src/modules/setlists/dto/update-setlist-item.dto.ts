import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateSetlistItemDto {
  @IsOptional()
  @IsUUID()
  songId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  artist?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  originalKey?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  selectedKey?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bpm?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  transitionNotes?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capo?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  arrangement?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  version?: string | null;
}
