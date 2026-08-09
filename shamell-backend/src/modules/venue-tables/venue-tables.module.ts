import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { VenueTablesController } from './controllers/venue-tables.controller';
import { VenueTablesRepository } from './services/venue-tables.repository';
import { VenueTablesService } from './services/venue-tables.service';

@Module({
  imports: [PrismaModule, FloorLayoutModule],
  controllers: [VenueTablesController],
  providers: [VenueTablesRepository, VenueTablesService],
})
export class VenueTablesModule {}
