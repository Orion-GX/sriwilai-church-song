import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { RolePermissionEntity } from './role-permission.entity';

@Entity({ name: 'permissions' })
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_permissions_code', { unique: true })
  @Column({ type: 'varchar', length: 120 })
  code!: string;

  @Column({ type: 'varchar', length: 80 })
  module!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.permission)
  rolePermissions!: RolePermissionEntity[];
}
