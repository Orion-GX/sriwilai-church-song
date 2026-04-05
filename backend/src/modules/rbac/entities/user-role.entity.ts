import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { RoleEntity } from './role.entity';

export type UserRoleScopeType = 'global' | 'church' | 'personal';

@Entity({ name: 'user_roles' })
export class UserRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_user_roles_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Index('idx_user_roles_role_id')
  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => RoleEntity, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;

  @Column({ name: 'scope_type', type: 'varchar', length: 20 })
  scopeType!: UserRoleScopeType;

  @Index('idx_user_roles_scope')
  @Column({ name: 'scope_id', type: 'uuid', nullable: true })
  scopeId!: string | null;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy!: string | null;

  @Column({ name: 'effective_from', type: 'timestamptz', nullable: true })
  effectiveFrom!: Date | null;

  @Column({ name: 'effective_to', type: 'timestamptz', nullable: true })
  effectiveTo!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
