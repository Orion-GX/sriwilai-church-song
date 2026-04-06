import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ChurchEntity } from '../../churches/entities/church.entity';
import { UserEntity } from '../../users/entities/user.entity';

import { SongCategoryEntity } from './song-category.entity';
import { SongTagEntity } from './song-tag.entity';

@Entity({ name: 'songs' })
export class SongEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_songs_church_published')
  @Column({ name: 'church_id', type: 'uuid', nullable: true })
  churchId!: string | null;

  @ManyToOne(() => ChurchEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'church_id' })
  church!: ChurchEntity | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 180 })
  slug!: string;

  @Column({ name: 'chordpro_body', type: 'text' })
  chordproBody!: string;

  @Index('idx_songs_category')
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => SongCategoryEntity, (c) => c.songs, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: SongCategoryEntity | null;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ name: 'view_count', type: 'integer', default: 0 })
  viewCount!: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser!: UserEntity | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy!: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser!: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @ManyToMany(() => SongTagEntity, (t) => t.songs, {
    cascade: false,
  })
  @JoinTable({
    name: 'song_song_tags',
    joinColumn: { name: 'song_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: SongTagEntity[];
}
