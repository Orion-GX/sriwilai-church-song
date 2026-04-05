import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import * as compression from 'compression';
import { AppModule } from './app.module';
import { AppConfiguration } from './config/configuration';
import { requestContextMiddleware } from './infrastructure/logging/request-context.middleware';
import { SocketIoAdapter } from './infrastructure/socket-io/socket-io.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.use(requestContextMiddleware);

  const configService = app.get<ConfigService<AppConfiguration, true>>(ConfigService);
  const liveWs = configService.get('liveWs', { infer: true });
  const redisConfig = configService.get('redis', { infer: true });

  app.useWebSocketAdapter(
    new SocketIoAdapter(app, {
      useRedisAdapter: liveWs.useRedisAdapter,
      redis: redisConfig,
    }),
  );

  const appConfig = configService.get('app', { infer: true });
  const corsConfig = configService.get('cors', { infer: true });

  if (corsConfig.origins.length > 0) {
    app.enableCors({
      origin: corsConfig.origins,
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-church-id',
        'X-Church-Id',
        'X-Request-Id',
        'Accept',
      ],
      exposedHeaders: ['Content-Length'],
    });
  } else if (appConfig.nodeEnv === 'production') {
    app.get(Logger).warn(
      'CORS is disabled (empty CORS_ORIGIN). Browser cross-origin API calls will fail unless traffic is same-origin via reverse proxy.',
    );
  }

  app.setGlobalPrefix(appConfig.appBasePath);
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  app.enableShutdownHooks();

  await app.listen(appConfig.port, '0.0.0.0', () => {
    app.get(Logger).log(`Server is running on port ${appConfig.port}`);
  });
}

void bootstrap();
