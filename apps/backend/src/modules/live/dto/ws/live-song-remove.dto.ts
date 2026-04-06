import { IsUUID } from 'class-validator';

/** Client → Server: `live:songs:remove` */
export class LiveSongRemovePayloadDto {
  @IsUUID('4')
  sessionId!: string;

  @IsUUID('4')
  liveSongId!: string;
}
