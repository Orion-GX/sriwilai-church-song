import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'personal_setlists' })
export class PersonalSetlistEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_personal_setlists_owner_user_id')
  @Column({ name: 'owner_user_id', type: 'uuid' })
  ownerUserId!: string;

  @Index('idx_personal_setlists_church_id')
  @Column({ name: 'church_id', type: 'uuid', nullable: true })
  churchId!: string | null;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @Index('idx_personal_setlists_share_token', { unique: true })
  @Column({ name: 'share_token', type: 'varchar', length: 64, nullable: true })
  shareToken!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
