import { IsBoolean, IsOptional } from 'class-validator';

export class SharePersonalSetlistDto {
  @IsOptional()
  @IsBoolean()
  /** หมุน share token ใหม่ (เพิกถอนลิงก์เดิม) */
  rotate?: boolean;
}
