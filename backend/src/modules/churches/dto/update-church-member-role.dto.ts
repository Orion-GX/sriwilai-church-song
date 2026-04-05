import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateChurchMemberRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  roleCode!: string;
}
