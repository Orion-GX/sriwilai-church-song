import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChurchMemberEntity } from '../churches/entities/church-member.entity';

import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { RbacService } from './rbac.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity, RoleEntity, RolePermissionEntity, UserRoleEntity, ChurchMemberEntity])],
  providers: [RbacService, RolesGuard, PermissionsGuard],
  exports: [RbacService, RolesGuard, PermissionsGuard],
})
export class RbacModule {}
