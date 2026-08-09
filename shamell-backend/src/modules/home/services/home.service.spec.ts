import { Test } from '@nestjs/testing';
import { createAboutServiceMock } from '../../about/__mocks__/about.service.mock';
import { AboutService } from '../../about/services/about.service';
import { createEventsServiceMock } from '../../events/__mocks__/events.service.mock';
import { EventsService } from '../../events/services/events.service';
import { createHeaderMediaServiceMock } from '../../header-media/__mocks__/header-media.service.mock';
import { createHeaderTextServiceMock } from '../../header-media/__mocks__/header-text.service.mock';
import { HeaderMediaService } from '../../header-media/services/header-media.service';
import { HeaderTextService } from '../../header-media/services/header-text.service';
import { VenueLayoutSettingsService } from '../../venue-layout-settings/services/venue-layout-settings.service';
import { makeOnComingSettings } from '../__mocks__/home.fixtures';
import { createVenueLayoutSettingsServiceMock } from '../../venue-layout-settings/__mocks__/venue-layout-settings.service.mock';
import { HomeService } from './home.service';

describe('HomeService', () => {
  let service: HomeService;
  const about = createAboutServiceMock();
  const headerMedia = createHeaderMediaServiceMock();
  const headerText = createHeaderTextServiceMock();
  const venueLayout = createVenueLayoutSettingsServiceMock();
  const events = createEventsServiceMock();

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

    const moduleRef = await Test.createTestingModule({
      providers: [
        HomeService,
        { provide: AboutService, useValue: about },
        { provide: HeaderMediaService, useValue: headerMedia },
        { provide: HeaderTextService, useValue: headerText },
        { provide: VenueLayoutSettingsService, useValue: venueLayout },
        { provide: EventsService, useValue: events },
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
  });

  it('clears upcoming events when clientEnabled is false', async () => {
    venueLayout.getPublicSettings.mockResolvedValue(
      makeOnComingSettings({ clientEnabled: false }),
    );

    const result = await service.getAboveFoldData();
    expect(result.upcomingEvents).toEqual([]);
    expect(events.getPublicUpcomingHubEvents).toHaveBeenCalled();
  });
});
