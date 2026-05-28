import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { FloorLayoutService } from '../floor-layout/floor-layout.service';
import { VenueLayoutSettingsService } from './venue-layout-settings.service';

@Controller(['on-coming-events', 'venue-layout'])
export class VenueLayoutPublicController {
  constructor(
    private readonly venueLayoutSettingsService: VenueLayoutSettingsService,
    private readonly floorLayoutService: FloorLayoutService,
  ) {}

  @Get('public')
  @HttpCode(HttpStatus.OK)
  async getPublicBundle() {
    const settings = await this.venueLayoutSettingsService.getPublicSettings();
    const layout = settings.clientEnabled
      ? await this.floorLayoutService.getPublicFloorLayoutForClient()
      : null;
    return { settings, layout };
  }
}
