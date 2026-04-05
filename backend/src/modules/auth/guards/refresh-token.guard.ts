import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { AppConfiguration } from '../../../config/configuration';
import { JwtPayload } from '../types/jwt-payload.type';

type RequestWithRefresh = Request & {
  refreshToken?: string;
  refreshPayload?: JwtPayload;
};

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<AppConfiguration, true>,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithRefresh>();
    const authConfig = this.configService.get('auth', { infer: true });
    const token = request.cookies?.[authConfig.refreshCookieName] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: authConfig.refreshTokenSecret,
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }
      request.refreshToken = token;
      request.refreshPayload = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
