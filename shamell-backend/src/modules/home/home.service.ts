import { Injectable } from '@nestjs/common';
import { AboutService } from '../about/about.service';
import { EventsService } from '../events/events.service';
import { HeaderMediaService } from '../header-media/header-media.service';
import { HeaderTextService } from '../header-media/header-text/header-text.service';
import { VenueLayoutSettingsService } from '../venue-layout-settings/venue-layout-settings.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly aboutService: AboutService,
    private readonly headerMediaService: HeaderMediaService,
    private readonly headerTextService: HeaderTextService,
    private readonly venueLayoutSettingsService: VenueLayoutSettingsService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Above-the-fold home payload in a single round-trip: hero media + hero text +
   * about content + on-coming-events settings + upcoming hub events (when enabled).
   */
  async getAboveFoldData() {
    const [about, headerPhotos, headerText, onComingSettings, upcomingEvents] =
      await Promise.all([
        this.aboutService.getPublicAboutContentOrNull(),
        this.headerMediaService.getPublicHeaderPhotos(),
        this.headerTextService.getPublicHeaderText(),
        this.venueLayoutSettingsService.getPublicSettings(),
        this.eventsService.getPublicUpcomingHubEvents(),
      ]);

    return {
      about,
      headerPhotos,
      headerText,
      onComingSettings,
      upcomingEvents: onComingSettings.clientEnabled ? upcomingEvents : [],
    };
  }
}
