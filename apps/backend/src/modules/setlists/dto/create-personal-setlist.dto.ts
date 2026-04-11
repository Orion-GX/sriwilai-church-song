import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreatePersonalSetlistItemDto {
  @IsUUID()
  songId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  artist?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  originalKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  selectedKey?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bpm?: number;

  @IsOptional()
  @IsString()
  transitionNotes?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  arrangement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  version?: string;
}

export class CreatePersonalSetlistDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  teamName?: string;

  @IsOptional()
  @IsIn(['vertical', 'horizontal'])
  presentationLayout?: 'vertical' | 'horizontal';

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePersonalSetlistItemDto)
  songs?: CreatePersonalSetlistItemDto[];
}
