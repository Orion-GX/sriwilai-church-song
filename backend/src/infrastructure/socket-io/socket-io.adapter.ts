import { INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis, { RedisOptions } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

import type { AppConfiguration } from '../../config/configuration';

export interface SocketIoAdapterOptions {
  useRedisAdapter: boolean;
  redis: AppConfiguration['redis'];
}

/** prefix คีย์ Redis ของ adapter — แยกจากงานอื่นที่ใช้ DB เดียวกัน */
const REDIS_ADAPTER_KEY = 'ccp:socket.io';

export class SocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIoAdapter.name);

  constructor(
    app: INestApplication,
    private readonly opts: SocketIoAdapterOptions,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: true, credentials: true },
    }) as Server;

    if (this.opts.useRedisAdapter) {
      const redisOpts = this.redisOptionsFromConfig(this.opts.redis);
      const pubClient = new Redis(redisOpts);
      const subClient = pubClient.duplicate();

      const logErr = (name: string) => (err: Error) => {
        this.logger.error(`Socket.IO Redis ${name}: ${err.message}`);
      };
      pubClient.on('error', logErr('pub'));
      subClient.on('error', logErr('sub'));

      server.adapter(
        createAdapter(pubClient, subClient, {
          key: REDIS_ADAPTER_KEY,
        }),
      );
      this.logger.log('Socket.IO: @socket.io/redis-adapter enabled (multi-instance safe)');
    } else {
      this.logger.log('Socket.IO: in-memory adapter (single instance)');
    }

    return server;
  }

  private redisOptionsFromConfig(redis: AppConfiguration['redis']): RedisOptions {
    return {
      host: redis.host,
      port: redis.port,
      db: redis.db,
      password: redis.password || undefined,
      enableReadyCheck: true,
      lazyConnect: false,
      /** แนะนำสำหรับ subscriber / pubsub */
      maxRetriesPerRequest: null,
      ...(redis.tls ? { tls: {} } : {}),
    };
  }
}
