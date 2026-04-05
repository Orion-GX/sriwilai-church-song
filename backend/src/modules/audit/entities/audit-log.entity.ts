import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ name: 'actor_type', type: 'varchar', length: 30 })
  actorType!: string;

  @Column({ type: 'varchar', length: 150 })
  action!: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 100 })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId!: string | null;

  @Column({ name: 'scope_church_id', type: 'uuid', nullable: true })
  scopeChurchId!: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId!: string | null;

  @Column({ name: 'ip_hash', type: 'varchar', length: 128, nullable: true })
  ipHash!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'before_data', type: 'jsonb', nullable: true })
  beforeData!: Record<string, unknown> | null;

  @Column({ name: 'after_data', type: 'jsonb', nullable: true })
  afterData!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20 })
  severity!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
