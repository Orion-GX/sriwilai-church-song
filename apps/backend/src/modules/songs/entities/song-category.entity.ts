import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { SongEntity } from './song.entity';

@Entity({ name: 'song_categories' })
export class SongCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_song_categories_code_active', ['code'], {
    unique: true,
    where: '"deleted_at" IS NULL',
  })
  @Column({ type: 'varchar', length: 80 })
  code!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => SongEntity, (s) => s.category)
  songs!: SongEntity[];
}
