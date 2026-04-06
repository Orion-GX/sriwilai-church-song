import { IsUUID, IsString, MaxLength, MinLength } from 'class-validator';

export class AddChurchMemberDto {
  @IsUUID('4')
  userId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  roleCode!: string;
}
