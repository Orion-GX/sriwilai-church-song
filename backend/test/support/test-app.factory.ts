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
