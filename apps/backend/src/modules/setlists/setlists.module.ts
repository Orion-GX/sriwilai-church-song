import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PersonalSetlistItemEntity } from './entities/personal-setlist-item.entity';
import { PersonalSetlistEntity } from './entities/personal-setlist.entity';
import { SetlistsPublicController } from './setlists-public.controller';
import { SetlistsController } from './setlists.controller';
import { SetlistsService } from './setlists.service';

@Module({
  imports: [TypeOrmModule.forFeature([PersonalSetlistEntity, PersonalSetlistItemEntity])],
  controllers: [SetlistsController, SetlistsPublicController],
  providers: [SetlistsService],
})
export class SetlistsModule {}
