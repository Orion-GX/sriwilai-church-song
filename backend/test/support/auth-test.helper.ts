import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AuthResponseDto } from '../../src/modules/auth/dto/auth-response.dto';
import { buildLoginPayload, buildRegisterPayload, type LoginPayloadFixture } from './fixtures/user.fixture';

/** SuperTest instance ที่ยิงไปที่ HTTP server ของแอปทดสอบ */
export function createHttpServerRequest(app: INestApplication) {
  return request(app.getHttpServer());
}

/**
 * Agent รักษา cookie ระหว่างคำขอ (refresh cookie หลัง register/login)
 */
export function createCookieAgent(app: INestApplication) {
  return request.agent(app.getHttpServer());
}

/** แปลง header set-cookie จาก supertest เป็น array */
export function normalizeSetCookieHeader(raw: string | string[] | undefined): string[] | undefined {
  if (raw == null) {
    return undefined;
  }
  return Array.isArray(raw) ? raw : [raw];
}

/**
 * ลงทะเบียนผู้ใช้ใหม่ — ค่าเริ่มต้นจาก fixture (อีเมลไม่ซ้ำ)
 */
export async function registerTestUser(
  app: INestApplication,
  overrides?: Partial<ReturnType<typeof buildRegisterPayload>>,
): Promise<{ body: AuthResponseDto; setCookie: string[] | undefined }> {
  const payload = { ...buildRegisterPayload(), ...overrides };
  const res = await createHttpServerRequest(app).post('/api/v1/app/auth/register').send(payload).expect(201);
  return {
    body: res.body as AuthResponseDto,
    setCookie: normalizeSetCookieHeader(res.headers['set-cookie']),
  };
}

/**
 * ล็อกอินด้วย email/password (หลังมีบัญชีแล้ว)
 */
export async function loginTestUser(
  app: INestApplication,
  credentials: LoginPayloadFixture,
): Promise<{ body: AuthResponseDto; setCookie: string[] | undefined }> {
  const res = await createHttpServerRequest(app).post('/api/v1/app/auth/login').send(credentials).expect(200);
  return {
    body: res.body as AuthResponseDto,
    setCookie: normalizeSetCookieHeader(res.headers['set-cookie']),
  };
}

/**
 * Authorization: Bearer <accessToken>
 */
export function authBearerHeaders(accessToken: string): { Authorization: string } {
  const token = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;
  return { Authorization: token };
}

/**
 * ดึงค่า refresh token ดิบจาก header Set-Cookie (ค่าแรกที่ตรงกับชื่อคุกกี้)
 */
export function parseRefreshTokenFromSetCookie(
  setCookie: string[] | undefined,
  cookieName: string,
): string | undefined {
  if (!setCookie?.length) {
    return undefined;
  }
  const prefix = `${cookieName}=`;
  for (const line of setCookie) {
    if (line.startsWith(prefix)) {
      return line.split(';')[0].slice(prefix.length);
    }
  }
  return undefined;
}

export { buildLoginPayload, buildRegisterPayload };
