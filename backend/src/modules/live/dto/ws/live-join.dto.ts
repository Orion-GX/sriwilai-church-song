import { IsEnum, IsUUID } from 'class-validator';

export enum LiveParticipantModeDto {
  LEADER = 'leader',
  FOLLOWER = 'follower',
}

/** Client → Server: `live:join` */
export class LiveJoinPayloadDto {
  @IsUUID('4')
  sessionId!: string;

  @IsEnum(LiveParticipantModeDto)
  participantMode!: LiveParticipantModeDto;
}
