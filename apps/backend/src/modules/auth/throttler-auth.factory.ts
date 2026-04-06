import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Request } from 'express';

import { AppConfiguration } from '../../config/configuration';

/**
 * ใช้ throttler เดียวชื่อ `auth` แล้วคำนวณ limit ตาม path
 * endpoint `GET /me` ใช้ @SkipThrottle({ auth: true })
 * ส่ง `storage` (เช่น RedisThrottlerStorage) เพื่อใช้ร่วมกันข้ามหลาย instance
 */
export function createAuthThrottlerOptions(
  configService: ConfigService<AppConfiguration, true>,
  storage?: ThrottlerStorage,
): ThrottlerModuleOptions {
  const throttle = configService.get('throttle', { infer: true });

  const throttlers = [
    {
      name: 'auth',
      ttl: throttle.ttlMs,
      limit: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest<Request>();
        const path = (req.originalUrl ?? req.url ?? '').split('?')[0];
        if (path.includes('/register')) {
          return throttle.authRegisterLimit;
        }
        if (path.includes('/login')) {
          return throttle.authLoginLimit;
        }
        if (path.includes('/refresh')) {
          return throttle.authRefreshLimit;
        }
        if (path.includes('/logout')) {
          return throttle.authLogoutLimit;
        }
        return 100_000;
      },
    },
  ];

  if (storage) {
    return {
      storage,
      throttlers,
    };
  }

  return { throttlers };
}
