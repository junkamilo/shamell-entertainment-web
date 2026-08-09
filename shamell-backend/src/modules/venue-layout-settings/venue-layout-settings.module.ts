import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { VenueLayoutPublicController } from './controllers/venue-layout-public.controller';
import { VenueLayoutSettingsController } from './controllers/venue-layout-settings.controller';
import { VenueLayoutSettingsMediaService } from './services/venue-layout-settings-media.service';
import { VenueLayoutSettingsRepository } from './services/venue-layout-settings.repository';
import { VenueLayoutSettingsService } from './services/venue-layout-settings.service';

@Module({
  imports: [PrismaModule, FloorLayoutModule],
  controllers: [VenueLayoutSettingsController, VenueLayoutPublicController],
  providers: [
    VenueLayoutSettingsRepository,
    VenueLayoutSettingsMediaService,
    VenueLayoutSettingsService,
  ],
  exports: [VenueLayoutSettingsService],
})
export class VenueLayoutSettingsModule {}
