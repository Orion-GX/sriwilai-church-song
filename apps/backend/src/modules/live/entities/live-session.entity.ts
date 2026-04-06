import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ChurchEntity } from '../../churches/entities/church.entity';
import { UserEntity } from '../../users/entities/user.entity';

import type { LiveSyncState } from '../types/live-sync-state.type';
import { LiveSessionSongEntity } from './live-session-song.entity';

export type LiveSessionStatus = 'draft' | 'active' | 'ended';

@Entity({ name: 'live_sessions' })
export class LiveSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_live_sessions_church_status')
  @Column({ name: 'church_id', type: 'uuid', nullable: true })
  churchId!: string | null;

  @ManyToOne(() => ChurchEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'church_id' })
  church!: ChurchEntity | null;

  @Index('idx_live_sessions_leader')
  @Column({ name: 'leader_user_id', type: 'uuid' })
  leaderUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leader_user_id' })
  leader!: UserEntity;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status!: LiveSessionStatus;

  @Column({ name: 'sync_state', type: 'jsonb', nullable: true })
  syncState!: LiveSyncState | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => LiveSessionSongEntity, (s) => s.session, { cascade: false })
  sessionSongs!: LiveSessionSongEntity[];
}
