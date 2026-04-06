import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { SongEntity } from '../../songs/entities/song.entity';

import { LiveSessionEntity } from './live-session.entity';

@Entity({ name: 'live_session_songs' })
export class LiveSessionSongEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_live_session_songs_session_order')
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => LiveSessionEntity, (s) => s.sessionSongs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: LiveSessionEntity;

  @Column({ name: 'song_id', type: 'uuid' })
  songId!: string;

  @ManyToOne(() => SongEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'song_id' })
  song!: SongEntity;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
