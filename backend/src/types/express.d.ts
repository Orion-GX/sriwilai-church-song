import type { JwtPayload } from '../modules/auth/types/jwt-payload.type';

declare module 'express-serve-static-core' {
  interface Request {
    /** ตั้งโดย resolveRequestId / request context middleware */
    requestId?: string;
    user?: JwtPayload;
  }
}
