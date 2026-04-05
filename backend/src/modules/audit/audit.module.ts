import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogService } from './audit-log.service';
import { AuditLogEntity } from './entities/audit-log.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
