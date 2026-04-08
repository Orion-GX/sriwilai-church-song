import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfiguration } from '../../config/configuration';
import { RedisThrottlerStorage } from '../../infrastructure/redis/redis-throttler.storage';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshSessionEntity } from './entities/refresh-session.entity';
import { ChurchMemberEntity } from '../churches/entities/church-member.entity';
import { UserRoleEntity } from '../rbac/entities/user-role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { createAuthThrottlerOptions } from './throttler-auth.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshSessionEntity, UserRoleEntity, ChurchMemberEntity]),
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, RedisService],
      useFactory: (configService: ConfigService<AppConfiguration, true>, redisService: RedisService) => {
        const throttle = configService.get('throttle', { infer: true });
        const storage = throttle.useRedisStorage ? new RedisThrottlerStorage(redisService.client) : undefined;
        return createAuthThrottlerOptions(configService, storage);
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, RefreshTokenGuard],
  exports: [AuthService],
})
export class AuthModule {}
