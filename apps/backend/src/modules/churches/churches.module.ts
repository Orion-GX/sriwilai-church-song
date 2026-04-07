import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleEntity } from '../rbac/entities/role.entity';
import { UserRoleEntity } from '../rbac/entities/user-role.entity';
import { UserEntity } from '../users/entities/user.entity';

import { ChurchesController } from './churches.controller';
import { ChurchesService } from './churches.service';
import { ChurchMemberEntity } from './entities/church-member.entity';
import { ChurchEntity } from './entities/church.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChurchEntity, ChurchMemberEntity, UserRoleEntity, RoleEntity, UserEntity])],
  controllers: [ChurchesController],
  providers: [ChurchesService],
  exports: [ChurchesService],
})
export class ChurchesModule {}
