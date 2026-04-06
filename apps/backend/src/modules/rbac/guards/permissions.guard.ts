import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { IS_PUBLIC_KEY } from '../../../common/constants/metadata-keys';
import { JwtPayload } from '../../auth/types/jwt-payload.type';
import { CHURCH_ID_HEADER, PERMISSIONS_KEY, REQUIRE_CHURCH_ID_KEY } from '../rbac.constants';
import { RbacService } from '../rbac.service';

function extractChurchId(request: Request): string | null {
  const raw = request.headers[CHURCH_ID_HEADER];
  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  const v = raw.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) {
    return null;
  }
  return v;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) {
      return true;
    }

    const permissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;
    if (!user?.sub) {
      throw new UnauthorizedException();
    }

    const requireChurch = this.reflector.getAllAndOverride<boolean>(REQUIRE_CHURCH_ID_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const churchId = extractChurchId(request);
    if (requireChurch && !churchId) {
      throw new BadRequestException(`Header ${CHURCH_ID_HEADER} is required`);
    }

    const ok = await this.rbacService.userHasAllPermissions(user.sub, permissions, churchId);
    if (!ok) {
      throw new ForbiddenException('Insufficient permission');
    }
    return true;
  }
}
