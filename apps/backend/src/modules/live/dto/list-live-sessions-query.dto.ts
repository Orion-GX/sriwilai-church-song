import { IsOptional, IsUUID } from 'class-validator';

export class ListLiveSessionsQueryDto {
  @IsOptional()
  @IsUUID('4')
  churchId?: string;
}
