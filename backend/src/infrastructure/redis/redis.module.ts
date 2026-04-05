import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

import { AppConfiguration } from '../../config/configuration';

import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfiguration, true>) => {
        const redisConfig = configService.get('redis', { infer: true });

        const options: RedisOptions = {
          host: redisConfig.host,
          port: redisConfig.port,
          db: redisConfig.db,
          password: redisConfig.password || undefined,
          enableReadyCheck: true,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
        };

        if (redisConfig.tls) {
          options.tls = {};
        }

        return new Redis(options);
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
