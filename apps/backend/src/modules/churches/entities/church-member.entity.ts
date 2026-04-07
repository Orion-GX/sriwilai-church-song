import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { RoleEntity } from '../../rbac/entities/role.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ChurchEntity } from './church.entity';

@Entity({ name: 'church_members' })
export class ChurchMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_church_members_church_user')
  @Column({ name: 'church_id', type: 'uuid' })
  churchId!: string;

  @ManyToOne(() => ChurchEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'church_id' })
  church!: ChurchEntity;

  @Index('idx_church_members_user')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Index('idx_church_members_role')
  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
