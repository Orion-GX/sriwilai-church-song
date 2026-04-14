import { ChurchEntity } from '../entities/church.entity';

export class ChurchResponseDto {
  id!: string;
  name!: string;
  code!: string;
  ownerUserId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(row: ChurchEntity): ChurchResponseDto {
    const dto = new ChurchResponseDto();
    dto.id = row.id;
    dto.name = row.name;
    dto.code = row.code;
    dto.ownerUserId = row.ownerUserId;
    dto.createdAt = row.createdAt;
    dto.updatedAt = row.updatedAt;
    return dto;
  }
}
