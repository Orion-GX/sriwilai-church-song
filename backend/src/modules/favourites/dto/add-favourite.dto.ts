import { IsUUID } from 'class-validator';

export class AddFavouriteDto {
  @IsUUID('4')
  songId!: string;
}
