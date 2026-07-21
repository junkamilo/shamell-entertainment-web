import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { VenueLayoutPublicController } from './venue-layout-public.controller';
import { VenueLayoutSettingsController } from './venue-layout-settings.controller';
import { VenueLayoutSettingsService } from './venue-layout-settings.service';

@Module({
  imports: [PrismaModule, FloorLayoutModule],
  controllers: [VenueLayoutSettingsController, VenueLayoutPublicController],
  providers: [VenueLayoutSettingsService],
  exports: [VenueLayoutSettingsService],
})
export class VenueLayoutSettingsModule {}
