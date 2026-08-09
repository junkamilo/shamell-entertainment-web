import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { makeVenueLayoutSettingsRow } from '../__mocks__/venue-layout-settings.fixtures';
import { createVenueLayoutSettingsMediaServiceMock } from '../__mocks__/venue-layout-settings-media.service.mock';
import { createVenueLayoutSettingsRepositoryMock } from '../__mocks__/venue-layout-settings.repository.mock';
import { VenueLayoutSettingsMediaService } from './venue-layout-settings-media.service';
import { VenueLayoutSettingsRepository } from './venue-layout-settings.repository';
import { VenueLayoutSettingsService } from './venue-layout-settings.service';

describe('VenueLayoutSettingsService', () => {
  let service: VenueLayoutSettingsService;
  const repository = createVenueLayoutSettingsRepositoryMock();
  const media = createVenueLayoutSettingsMediaServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        VenueLayoutSettingsService,
        { provide: VenueLayoutSettingsRepository, useValue: repository },
        { provide: VenueLayoutSettingsMediaService, useValue: media },
      ],
    }).compile();
    service = moduleRef.get(VenueLayoutSettingsService);
  });

  it('getPublicSettings maps defaults when no row', async () => {
    repository.findLatest.mockResolvedValue(null);
    await expect(service.getPublicSettings()).resolves.toEqual(
      expect.objectContaining({
        clientEnabled: false,
        promoTitle: null,
        reservationTimezone: 'America/New_York',
      }),
    );
  });

  it('upsertAdminSettings creates when missing', async () => {
    const row = makeVenueLayoutSettingsRow({ promoTitle: 'Hello' });
    repository.findLatest.mockResolvedValue(null);
    repository.create.mockResolvedValue(row);
    const result = await service.upsertAdminSettings({ promoTitle: 'Hello' });
    expect(result.message).toBe('On Coming Events settings saved.');
    expect(result.settings.promoTitle).toBe('Hello');
  });

  it('upsertAdminSettings rejects invalid sales window', async () => {
    repository.findLatest.mockResolvedValue(makeVenueLayoutSettingsRow());
    await expect(
      service.upsertAdminSettings({
        reservationOpensAt: '2026-08-10T00:00:00.000Z',
        reservationClosesAt: '2026-08-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('patchAdminEnabled updates existing row', async () => {
    const existing = makeVenueLayoutSettingsRow({ clientEnabled: false });
    const saved = makeVenueLayoutSettingsRow({ clientEnabled: true });
    repository.findLatest.mockResolvedValue(existing);
    repository.update.mockResolvedValue(saved);
    const result = await service.patchAdminEnabled(true);
    expect(result.settings.clientEnabled).toBe(true);
  });
});
