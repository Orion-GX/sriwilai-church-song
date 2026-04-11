import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { PersonalSetlistEntity } from './personal-setlist.entity';

@Entity({ name: 'personal_setlist_items' })
@Unique('uq_personal_setlist_items_setlist_order', ['setlistId', 'order'])
export class PersonalSetlistItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_personal_setlist_items_setlist_id')
  @Column({ name: 'setlist_id', type: 'uuid' })
  setlistId!: string;

  @ManyToOne(() => PersonalSetlistEntity, (setlist) => setlist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'setlist_id' })
  setlist!: PersonalSetlistEntity;

  @Column({ name: 'song_id', type: 'uuid' })
  songId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  artist!: string | null;

  @Column({ name: 'original_key', type: 'varchar', length: 24, nullable: true })
  originalKey!: string | null;

  @Column({ name: 'selected_key', type: 'varchar', length: 24, nullable: true })
  selectedKey!: string | null;

  @Column({ type: 'integer', nullable: true })
  bpm!: number | null;

  @Column({ type: 'integer' })
  order!: number;

  @Column({ name: 'transition_notes', type: 'text', nullable: true })
  transitionNotes!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'integer', nullable: true })
  capo!: number | null;

  @Column({ type: 'integer', nullable: true })
  duration!: number | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  arrangement!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  version!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
