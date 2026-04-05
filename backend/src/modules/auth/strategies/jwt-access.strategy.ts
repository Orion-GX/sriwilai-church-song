import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AppConfiguration } from '../../../config/configuration';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(configService: ConfigService<AppConfiguration, true>) {
    const authConfig = configService.get('auth', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.accessTokenSecret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
