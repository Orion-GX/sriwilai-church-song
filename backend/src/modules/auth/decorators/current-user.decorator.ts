import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { JwtPayload } from '../types/jwt-payload.type';

export const CurrentUser = createParamDecorator((data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
  const user = request.user;
  if (!data) {
    return user;
  }
  return user?.[data];
});
