import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateChurchDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  /** ถ้าไม่ส่ง จะสร้างจากชื่ออัตโนมัติ (a-z 0-9 และ -) */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with single hyphens',
  })
  slug?: string;
}
