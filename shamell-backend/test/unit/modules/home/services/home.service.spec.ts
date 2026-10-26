import { Test } from '@nestjs/testing';
import { EventPublicSection } from '@prisma/client';
import { createAboutServiceMock } from '@test-support/modules/about/mocks/about.service.mock';
import { AboutService } from '@app/modules/about/services/about.service';
import { createEventsServiceMock } from '@test-support/modules/events/mocks/events.service.mock';
import { EventsService } from '@app/modules/events/services/events.service';
import { createHeaderMediaServiceMock } from '@test-support/modules/header-media/mocks/header-media.service.mock';
import { createHeaderTextServiceMock } from '@test-support/modules/header-media/mocks/header-text.service.mock';
import { HeaderMediaService } from '@app/modules/header-media/services/header-media.service';
import { HeaderTextService } from '@app/modules/header-media/services/header-text.service';
import { createServicesServiceMock } from '@test-support/modules/services/mocks/services.service.mock';
import { ServicesService } from '@app/modules/services/services/services.service';
import { VenueLayoutSettingsService } from '@app/modules/venue-layout-settings/services/venue-layout-settings.service';
import { makeOnComingSettings } from '@test-support/modules/home/fixtures/home.fixtures';
import { createVenueLayoutSettingsServiceMock } from '@test-support/modules/venue-layout-settings/mocks/venue-layout-settings.service.mock';
import { HomeService } from '@app/modules/home/services/home.service';

describe('HomeService', () => {
  let service: HomeService;
  const about = createAboutServiceMock();
  const headerMedia = createHeaderMediaServiceMock();
  const headerText = createHeaderTextServiceMock();
  const venueLayout = createVenueLayoutSettingsServiceMock();
  const events = createEventsServiceMock();
  const services = createServicesServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    about.getPublicAboutContentOrNull.mockResolvedValue({
      id: 'about-1',
      title: 'About',
    });
    headerMedia.getPublicHeaderPhotos.mockResolvedValue([{ id: 'photo-1' }]);
    headerText.getPublicHeaderText.mockResolvedValue({ headline: 'SHAMELL' });
    events.getPublicUpcomingHubEvents.mockResolvedValue([
      { id: 'event-1', title: 'Show' },
    ]);
    events.getPublicEvents.mockResolvedValue([
      { id: 'gen-1', eventTypeName: 'Gala' },
    ]);
    services.getPublicServices.mockResolvedValue([
      { id: 'svc-1', serviceTypeName: 'Fire' },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        HomeService,
        { provide: AboutService, useValue: about },
        { provide: HeaderMediaService, useValue: headerMedia },
        { provide: HeaderTextService, useValue: headerText },
        { provide: VenueLayoutSettingsService, useValue: venueLayout },
        { provide: EventsService, useValue: events },
        { provide: ServicesService, useValue: services },
      ],
    }).compile();
    service = moduleRef.get(HomeService);
  });

  it('returns upcoming events when clientEnabled is true', async () => {
    venueLayout.getPublicSettings.mockResolvedValue(
      makeOnComingSettings({ clientEnabled: true }),
    );

    const result = await service.getAboveFoldData();
    expect(result.upcomingEvents).toEqual([{ id: 'event-1', title: 'Show' }]);
    expect(result.about).toEqual({ id: 'about-1', title: 'About' });
    expect(result.headerPhotos).toHaveLength(1);
    expect(result.headerText).toEqual({ headline: 'SHAMELL' });
    expect(result.services).toEqual([{ id: 'svc-1', serviceTypeName: 'Fire' }]);
    expect(result.generalEvents).toEqual([
      { id: 'gen-1', eventTypeName: 'Gala' },
    ]);
    expect(events.getPublicEvents).toHaveBeenCalledWith({
      publicSection: EventPublicSection.GENERAL,
    });
    expect(services.getPublicServices).toHaveBeenCalled();
  });

  it('clears upcoming events when clientEnabled is false', async () => {
    venueLayout.getPublicSettings.mockResolvedValue(
      makeOnComingSettings({ clientEnabled: false }),
    );

    const result = await service.getAboveFoldData();
    expect(result.upcomingEvents).toEqual([]);
    expect(events.getPublicUpcomingHubEvents).toHaveBeenCalled();
    expect(result.services).toHaveLength(1);
    expect(result.generalEvents).toHaveLength(1);
  });
});
