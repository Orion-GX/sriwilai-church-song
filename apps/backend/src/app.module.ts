import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ErrorLoggingInterceptor } from './infrastructure/logging/error-logging.interceptor';
import { HttpExceptionLoggingFilter } from './infrastructure/logging/http-exception.filter';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChurchesModule } from './modules/churches/churches.module';
import { FavouritesModule } from './modules/favourites/favourites.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthModule } from './modules/health/health.module';
import { LiveModule } from './modules/live/live.module';
import { PermissionsGuard } from './modules/rbac/guards/permissions.guard';
import { RolesGuard } from './modules/rbac/guards/roles.guard';
import { RbacModule } from './modules/rbac/rbac.module';
import { SetlistsModule } from './modules/setlists/setlists.module';
import { SongsModule } from './modules/songs/songs.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    DatabaseModule,
    RedisModule,
    AuditModule,
    AdminModule,
    RbacModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ChurchesModule,
    SongsModule,
    FavouritesModule,
    LiveModule,
    SetlistsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ErrorLoggingInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionLoggingFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
