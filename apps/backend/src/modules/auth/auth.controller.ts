import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { AppConfiguration } from '../../config/configuration';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthService } from './auth.service';
import { JwtPayload } from './types/jwt-payload.type';
import { resolveRequestId } from './utils/request-id.util';

@UseGuards(ThrottlerGuard)
@Controller({
  path: 'app/auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() payload: RegisterDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(payload, {
      ipAddress,
      userAgent: request.headers['user-agent'],
      requestId: resolveRequestId(request),
    });
    this.setRefreshCookie(response, result.refreshToken);
    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() payload: LoginDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(payload, {
      ipAddress,
      userAgent: request.headers['user-agent'],
      requestId: resolveRequestId(request),
    });
    this.setRefreshCookie(response, result.refreshToken);
    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(
    @Req() request: Request & { refreshToken: string; refreshPayload: JwtPayload },
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.refreshTokens(request.refreshToken, request.refreshPayload, {
      ipAddress,
      userAgent: request.headers['user-agent'],
      requestId: resolveRequestId(request),
    });
    this.setRefreshCookie(response, result.refreshToken);
    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.authService.logout(user.sub, user.sessionId, {
      ipAddress,
      userAgent: request.headers['user-agent'],
      requestId: resolveRequestId(request),
    });
    this.clearRefreshCookie(response);
    return { success: true };
  }

  @SkipThrottle({ auth: true })
  @Get('me')
  async me(@CurrentUser('sub') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    const authConfig = this.configService.get('auth', { infer: true });
    const appConfig = this.configService.get('app', { infer: true });
    const isProd = appConfig.nodeEnv === 'production';
    const maxAge = authConfig.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000;

    response.cookie(authConfig.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/api/v1/app/auth',
      maxAge,
    });
  }

  private clearRefreshCookie(response: Response): void {
    const authConfig = this.configService.get('auth', { infer: true });
    response.clearCookie(authConfig.refreshCookieName, {
      path: '/api/v1/app/auth',
      sameSite: 'strict',
    });
  }
}
