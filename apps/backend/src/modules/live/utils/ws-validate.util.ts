import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { WsException } from '@nestjs/websockets';

export function assertWsDto<T extends object>(Cls: new () => T, raw: unknown): T {
  const inst = plainToInstance(Cls, raw ?? {}, { enableImplicitConversion: true });
  const errors = validateSync(inst as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    throw new WsException({
      code: 'validation_error',
      message: errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; '),
    });
  }
  return inst;
}
