import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { configureApplication } from './bootstrap/configure-application';
import { AppModule } from './app.module';
import { AppConfiguration } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  await configureApplication(app);

  const configService = app.get<ConfigService<AppConfiguration, true>>(ConfigService);
  const appConfig = configService.get('app', { infer: true });

  await app.listen(appConfig.port, '0.0.0.0', () => {
    app.get(Logger).log(`Server is running on port ${appConfig.port}`);
  });
}

void bootstrap();
