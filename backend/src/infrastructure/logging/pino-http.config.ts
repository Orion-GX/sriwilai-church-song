import type { Request } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { Params } from 'nestjs-pino';

import { resolveRequestId } from '../../modules/auth/utils/request-id.util';

/** path สำหรับ pino redact — ส่งต่อ plain body ที่รู้จักจาก DTO หลัก */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.refreshToken',
  'req.body.accessToken',
  'req.body.token',
  'req.body.chordproBody',
  'req.body.chordpro_body',
  'req.body.secret',
];

export const buildPinoHttpConfig = (prettyPrint: boolean, level: string): Params['pinoHttp'] =>
  ({
    level,
    genReqId: (req: IncomingMessage) => resolveRequestId(req as Request),
    customProps: (req: IncomingMessage, _res: ServerResponse) => {
      const r = req as Request;
      return {
        requestId: r.requestId,
        userId: r.user?.sub,
      };
    },
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    autoLogging: {
      ignore: (req: IncomingMessage) => {
        const u = typeof req.url === 'string' ? req.url : '';
        return u.includes('/health');
      },
    },
    transport: prettyPrint
      ? {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
  }) as unknown as Params['pinoHttp'];
