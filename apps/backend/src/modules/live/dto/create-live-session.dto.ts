import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateLiveSessionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;
}
