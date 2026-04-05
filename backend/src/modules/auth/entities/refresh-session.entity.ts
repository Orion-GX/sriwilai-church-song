import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'refresh_sessions' })
export class RefreshSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_refresh_sessions_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.refreshSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Index('idx_refresh_sessions_family_id')
  @Column({ name: 'session_family_id', type: 'uuid' })
  sessionFamilyId!: string;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255 })
  refreshTokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'revoke_reason', type: 'varchar', length: 100, nullable: true })
  revokeReason!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'rotated_from_session_id', type: 'uuid', nullable: true })
  rotatedFromSessionId!: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
