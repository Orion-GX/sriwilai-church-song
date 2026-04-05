import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName?: string;

  /** เปลี่ยนรหัสผ่าน — ต้องส่ง currentPassword ควบคู่ */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword?: string;

  @ValidateIf((o: UpdateProfileDto) => o.newPassword !== undefined && o.newPassword.length > 0)
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  currentPassword?: string;
}
