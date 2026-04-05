import type { AddressInfo } from 'node:net';

import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../src/app.module';
import { configureApplication } from '../../src/bootstrap/configure-application';

/**
 * สร้างแอป Nest พร้อม middleware / pipes / WebSocket adapter เหมือน `main.ts`
 * (ไม่เรียก listen) — ใช้กับ supertest ผ่าน `app.getHttpServer()`
 */
export async function createConfiguredTestApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  await configureApplication(app);
  await app.init();
  return app;
}

/**
 * เปิดพอร์ตจริง (0 = สุ่ม) สำหรับ E2E ที่ต้องใช้ Socket.IO client ยิงไปที่ HTTP server เดียวกัน
 */
export async function createListeningTestApplication(): Promise<{
  app: INestApplication;
  baseUrl: string;
}> {
  const host = '127.0.0.1';
  const app = await createConfiguredTestApplication();
  await app.listen(0, host);
  const addr = app.getHttpServer().address() as AddressInfo | string | null;
  if (addr == null || typeof addr === 'string') {
    await app.close();
    throw new Error('createListeningTestApplication: expected TCP address');
  }
  return { app, baseUrl: `http://${host}:${addr.port}` };
}
