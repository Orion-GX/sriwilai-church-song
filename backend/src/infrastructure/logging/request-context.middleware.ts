import { NextFunction, Request, Response } from 'express';

import { resolveRequestId } from '../../modules/auth/utils/request-id.util';

/**
 * ตั้งค่า requestId คงที่ตลอด request และส่งกลับใน `x-request-id`
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = resolveRequestId(req);
  res.setHeader('x-request-id', id);
  next();
}
