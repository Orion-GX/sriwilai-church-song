import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** Client → Server: `live:songs:add` */
export class LiveSongAddPayloadDto {
  @IsUUID('4')
  sessionId!: string;

  @IsUUID('4')
  songId!: string;

  /** แทรกที่ตำแหน่ง (0-based); ไม่ส่ง = ต่อท้าย */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(499)
  position?: number;
}
