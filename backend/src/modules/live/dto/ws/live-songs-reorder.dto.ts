import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/** Client → Server: `live:songs:reorder` */
export class LiveSongsReorderPayloadDto {
  @IsUUID('4')
  sessionId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  orderedLiveSongIds!: string[];
}
