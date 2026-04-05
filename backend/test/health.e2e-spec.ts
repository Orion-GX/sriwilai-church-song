import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createConfiguredTestApplication } from './support/test-app.factory';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createConfiguredTestApplication();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health ตอบ 200 และ status ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(HttpStatus.OK);

    expect(res.body).toMatchObject({
      status: 'ok',
    });
    expect(res.body.info).toBeDefined();
  });
});
