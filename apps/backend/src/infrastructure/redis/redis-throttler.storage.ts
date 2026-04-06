import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

/**
 * Storage แบบ Redis สำหรับ @nestjs/throttler — ใช้ร่วมกันข้ามหลาย instance
 * ใช้ fixed window + block window หลังเกิน limit
 */
const LUA = `
local hitKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local blockTtl = redis.call('PTTL', blockKey)
if blockTtl > 0 then
  local hitsRaw = redis.call('GET', hitKey)
  local h
  if hitsRaw then
    h = tonumber(hitsRaw)
  else
    h = limit + 1
  end
  local hitPttl = redis.call('PTTL', hitKey)
  if hitPttl < 0 then
    hitPttl = ttl
  end
  return {'blocked', h, hitPttl, blockTtl}
end

local hits = redis.call('INCR', hitKey)
if hits == 1 then
  redis.call('PEXPIRE', hitKey, ttl)
end
local hitPttl = redis.call('PTTL', hitKey)

if hits > limit then
  redis.call('SET', blockKey, '1', 'PX', blockDuration)
  redis.call('DEL', hitKey)
  return {'newblock', hits, hitPttl, blockDuration}
end

return {'ok', hits, hitPttl, 0}
`;

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttler:hits:${throttlerName}:${key}`;
    const blockKey = `throttler:block:${throttlerName}:${key}`;

    const raw = (await this.redis.eval(LUA, 2, hitKey, blockKey, ttl, limit, blockDuration)) as [string, string, string, string];

    const mode = raw[0];
    const hits = Number.parseInt(String(raw[1]), 10);
    const hitPttlMs = Number.parseInt(String(raw[2]), 10);
    const fourth = Number.parseInt(String(raw[3]), 10);

    const timeToExpire = Math.max(0, Math.ceil(hitPttlMs / 1000));

    if (mode === 'blocked') {
      return {
        totalHits: hits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.max(0, Math.ceil(fourth / 1000)),
      };
    }

    if (mode === 'newblock') {
      return {
        totalHits: hits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.max(0, Math.ceil(fourth / 1000)),
      };
    }

    return {
      totalHits: hits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
