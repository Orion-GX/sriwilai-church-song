import { randomUUID } from 'crypto';

export interface RegisterPayloadFixture {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginPayloadFixture {
  email: string;
  password: string;
}

/**
 * payload สำหรับ POST /app/auth/register — อีเมลไม่ซ้ำต่อครั้งที่เรียก
 */
export function buildRegisterPayload(): RegisterPayloadFixture {
  const id = randomUUID().replace(/-/g, '').slice(0, 12);
  return {
    email: `e2e-user-${id}@example.test`,
    password: 'TestPassword123!x',
    displayName: 'E2E Test User',
  };
}

export function buildLoginPayload(email: string, password: string): LoginPayloadFixture {
  return { email, password };
}
