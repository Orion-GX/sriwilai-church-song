import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** เนื้อหาหน้าที่ leader ส่งให้ follower (ChordPro / scroll) */
export class LivePagePayloadDto {
  @IsInt()
  @Min(0)
  @Max(9_999)
  songIndex!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sectionLabel?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99_999)
  lineIndex?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9_999_999)
  charOffset?: number | null;

  /** 0..1 ตำแหน่ง scroll โดยประมาณ */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  scrollRatio?: number | null;

  /** ข้อมูลเสริมจาก client (เช่น theme) — จำกัดขนาด */
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

/** Client → Server: `live:sync:page` */
export class LiveSyncPagePayloadDto {
  @IsUUID('4')
  sessionId!: string;

  @ValidateNested()
  @Type(() => LivePagePayloadDto)
  page!: LivePagePayloadDto;
}
