import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PersonalSetlistEntity } from './entities/personal-setlist.entity';
import { SetlistsController } from './setlists.controller';
import { SetlistsService } from './setlists.service';

@Module({
  imports: [TypeOrmModule.forFeature([PersonalSetlistEntity])],
  controllers: [SetlistsController],
  providers: [SetlistsService],
})
export class SetlistsModule {}
