import { IsBoolean } from 'class-validator';

export class UpdateSetlistVisibilityDto {
  @IsBoolean()
  isPublic!: boolean;
}
