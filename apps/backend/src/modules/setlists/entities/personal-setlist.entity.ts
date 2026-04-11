import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PersonalSetlistItemEntity } from './personal-setlist-item.entity';

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

  @Column({ name: 'service_date', type: 'timestamptz', nullable: true })
  serviceDate!: Date | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  location!: string | null;

  @Column({ name: 'duration_minutes', type: 'integer', nullable: true })
  durationMinutes!: number | null;

  @Column({ name: 'team_name', type: 'varchar', length: 180, nullable: true })
  teamName!: string | null;

  @Column({ name: 'presentation_layout', type: 'varchar', length: 16, default: 'vertical' })
  presentationLayout!: 'vertical' | 'horizontal';

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

  @OneToMany(() => PersonalSetlistItemEntity, (item) => item.setlist)
  items!: PersonalSetlistItemEntity[];
}
