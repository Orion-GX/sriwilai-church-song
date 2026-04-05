import * as jwt from 'jsonwebtoken';

import type { JwtPayload } from '../../src/modules/auth/types/jwt-payload.type';

/**
 * JWT refresh ที่หมดอายุแล้ว — ใช้ทดสอบ RefreshTokenGuard / verify
 */
export function signExpiredRefreshToken(secret: string, payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ ...payload, exp: now - 120 }, secret, { algorithm: 'HS256' });
}
