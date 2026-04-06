import { HttpStatus, INestApplication } from '@nestjs/common';

import { authBearerHeaders, createHttpServerRequest } from './auth-test.helper';

/**
 * REST ไม่ใช่ ack ของ WS — รอจน JSONB sync_state ในฐานตรงกับค่าที่คาด (ลด duplicate / เวลา hard-code ในแต่ละสเปก)
 */
export async function waitForLiveSyncSongIndex(
  app: INestApplication,
  sessionId: string,
  token: string,
  songIndex: number,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 15_000;
  const intervalMs = options?.intervalMs ?? 50;
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const res = await createHttpServerRequest(app)
      .get(`/api/v1/app/live/sessions/${sessionId}`)
      .set(authBearerHeaders(token))
      .expect(HttpStatus.OK);

    if (res.body.session?.syncState?.songIndex === songIndex) {
      return;
    }
    if (Date.now() > deadline) {
      throw new Error(`waitForLiveSyncSongIndex: timeout waiting for songIndex ${songIndex}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
