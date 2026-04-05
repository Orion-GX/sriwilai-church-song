import { randomUUID } from 'crypto';

import { Request } from 'express';

const MAX_LEN = 100;

/** คืนค่า request id เดิมตลอด lifetime ของ request (เก็บบน req.requestId) */
export function resolveRequestId(request: Request): string {
  if (request.requestId) {
    return request.requestId;
  }
  const raw = request.headers['x-request-id'];
  if (typeof raw === 'string' && raw.length > 0) {
    const v = raw.length > MAX_LEN ? raw.slice(0, MAX_LEN) : raw;
    request.requestId = v;
    return v;
  }
  const generated = randomUUID();
  request.requestId = generated;
  return generated;
}
