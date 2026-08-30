import { Injectable } from '@nestjs/common';
import { EventPublicSection } from '@prisma/client';
import { AboutService } from '../../about/services/about.service';
import { EventsService } from '../../events/services/events.service';
import { HeaderMediaService } from '../../header-media/services/header-media.service';
import { HeaderTextService } from '../../header-media/services/header-text.service';
import { ServicesService } from '../../services/services/services.service';
import { VenueLayoutSettingsService } from '../../venue-layout-settings/services/venue-layout-settings.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly aboutService: AboutService,
    private readonly headerMediaService: HeaderMediaService,
    private readonly headerTextService: HeaderTextService,
    private readonly venueLayoutSettingsService: VenueLayoutSettingsService,
    private readonly eventsService: EventsService,
    private readonly servicesService: ServicesService,
  ) {}

  /**
   * Above-the-fold home payload in a single round-trip: hero media + hero text +
   * about content + on-coming-events settings + upcoming hub events (when enabled) +
   * service catalog + general event types (for SSR-seeded home sections).
   */
  async getAboveFoldData() {
    const [
      about,
      headerPhotos,
      headerText,
      onComingSettings,
      upcomingEvents,
      services,
      generalEvents,
    ] = await Promise.all([
      this.aboutService.getPublicAboutContentOrNull(),
      this.headerMediaService.getPublicHeaderPhotos(),
      this.headerTextService.getPublicHeaderText(),
      this.venueLayoutSettingsService.getPublicSettings(),
      this.eventsService.getPublicUpcomingHubEvents(),
      this.servicesService.getPublicServices(),
      this.eventsService.getPublicEvents({
        publicSection: EventPublicSection.GENERAL,
      }),
    ]);

    return {
      about,
      headerPhotos,
      headerText,
      onComingSettings,
      upcomingEvents: onComingSettings.clientEnabled ? upcomingEvents : [],
      services,
      generalEvents,
    };
  }
}
