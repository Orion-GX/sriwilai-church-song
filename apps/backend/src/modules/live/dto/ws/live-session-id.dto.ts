import { IsUUID } from 'class-validator';

export class LiveSessionIdPayloadDto {
  @IsUUID('4')
  sessionId!: string;
}
