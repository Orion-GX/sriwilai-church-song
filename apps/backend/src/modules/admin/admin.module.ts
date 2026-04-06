import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LiveSessionEntity } from '../live/entities/live-session.entity';
import { SongEntity } from '../songs/entities/song.entity';
import { UserEntity } from '../users/entities/user.entity';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([SongEntity, UserEntity, LiveSessionEntity])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
