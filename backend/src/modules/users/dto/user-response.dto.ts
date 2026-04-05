import { UserEntity } from '../entities/user.entity';

/** ข้อมูลผู้ใช้ที่ปลอดภัยต่อการส่งออก API — ไม่มี password / hash */
export class UserResponseDto {
  id!: string;
  email!: string;
  displayName!: string;
  status!: string;
  emailVerifiedAt!: Date | null;
  lastLoginAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(row: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = row.id;
    dto.email = row.email;
    dto.displayName = row.displayName;
    dto.status = row.status;
    dto.emailVerifiedAt = row.emailVerifiedAt;
    dto.lastLoginAt = row.lastLoginAt;
    dto.createdAt = row.createdAt;
    dto.updatedAt = row.updatedAt;
    return dto;
  }
}
