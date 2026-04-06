import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AppConfiguration } from '../../config/configuration';

import { buildPinoHttpConfig } from './pino-http.config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfiguration, true>) => {
        const loggingConfig = configService.get('logging', { infer: true });

        return {
          pinoHttp: buildPinoHttpConfig(loggingConfig.prettyPrint, loggingConfig.level),
        };
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
