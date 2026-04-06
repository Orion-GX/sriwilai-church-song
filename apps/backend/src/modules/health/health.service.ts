import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { DataSource } from 'typeorm';

import { AppConfiguration } from '../../config/configuration';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  async check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        await this.dataSource.query('SELECT 1');
        return { database: { status: 'up' } };
      },
      async (): Promise<HealthIndicatorResult> => {
        await this.redisService.client.ping();
        return { redis: { status: 'up' } };
      },
      async (): Promise<HealthIndicatorResult> => ({
        app: {
          status: 'up',
          name: this.configService.get('app.appName', { infer: true }),
          version: this.configService.get('app.appVersion', { infer: true }),
          env: this.configService.get('app.nodeEnv', { infer: true }),
        },
      }),
    ]);
  }
}
