import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfiguration } from '../../config/configuration';

import { SongEntity } from '../songs/entities/song.entity';

import { LiveSessionSongEntity } from './entities/live-session-song.entity';
import { LiveSessionEntity } from './entities/live-session.entity';
import { LiveController } from './live.controller';
import { LiveGateway } from './live.gateway';
import { LiveService } from './live.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([LiveSessionEntity, LiveSessionSongEntity, SongEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) => ({
        secret: config.get('auth', { infer: true }).accessTokenSecret,
      }),
    }),
  ],
  controllers: [LiveController],
  providers: [LiveService, LiveGateway],
  exports: [LiveService],
})
export class LiveModule {}
