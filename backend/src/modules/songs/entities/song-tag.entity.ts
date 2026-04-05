import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SongEntity } from './song.entity';

@Entity({ name: 'song_tags' })
export class SongTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_song_tags_slug_active', ['slug'], {
    unique: true,
    where: '"deleted_at" IS NULL',
  })
  @Column({ type: 'varchar', length: 80 })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @ManyToMany(() => SongEntity, (s) => s.tags)
  songs!: SongEntity[];
}
