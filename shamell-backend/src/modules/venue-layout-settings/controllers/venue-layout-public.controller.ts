import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { VENUE_LAYOUT_CONTROLLER_PATHS } from '../constants/venue-layout-settings.constants';
import { VenueLayoutSettingsService } from '../services/venue-layout-settings.service';

@Controller([...VENUE_LAYOUT_CONTROLLER_PATHS])
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
