import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { SongEntity } from '../../songs/entities/song.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'user_song_favorites' })
export class UserSongFavoriteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'song_id', type: 'uuid' })
  songId!: string;

  @ManyToOne(() => SongEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'song_id' })
  song!: SongEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
