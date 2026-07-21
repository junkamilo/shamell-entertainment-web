import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { VenueTablesController } from './venue-tables.controller';
import { VenueTablesService } from './venue-tables.service';

@Module({
  imports: [PrismaModule, FloorLayoutModule],
  controllers: [VenueTablesController],
  providers: [VenueTablesService],
})
export class VenueTablesModule {}
