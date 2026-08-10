import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { syncVenueSeatReservationEventDates } from '../../venue-reservations/utils/sync-venue-seat-reservation-event-date.util';
import {
  makePromoMulterFile,
  makeVenueLayoutSettingsRow,
} from '../__mocks__/venue-layout-settings.fixtures';
import { createVenueLayoutSettingsMediaServiceMock } from '../__mocks__/venue-layout-settings-media.service.mock';
import { createVenueLayoutSettingsRepositoryMock } from '../__mocks__/venue-layout-settings.repository.mock';
import { VenueLayoutSettingsMediaService } from './venue-layout-settings-media.service';
import { VenueLayoutSettingsRepository } from './venue-layout-settings.repository';
import { VenueLayoutSettingsService } from './venue-layout-settings.service';

jest.mock(
  '../../venue-reservations/utils/sync-venue-seat-reservation-event-date.util',
  () => ({
    syncVenueSeatReservationEventDates: jest.fn().mockResolvedValue(undefined),
  }),
);

const syncEventDatesMock = jest.mocked(syncVenueSeatReservationEventDates);

describe('VenueLayoutSettingsService', () => {
  let service: VenueLayoutSettingsService;
  const repository = createVenueLayoutSettingsRepositoryMock();
  const media = createVenueLayoutSettingsMediaServiceMock();
  const prismaStub = { venueSeatReservation: { updateMany: jest.fn() } };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue(prismaStub);
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

  it('isClientEnabled returns false when no row', async () => {
    repository.findLatest.mockResolvedValue(null);
    await expect(service.isClientEnabled()).resolves.toBe(false);
  });

  it('isClientEnabled returns stored flag', async () => {
    repository.findLatest.mockResolvedValue(
      makeVenueLayoutSettingsRow({ clientEnabled: true }),
    );
    await expect(service.isClientEnabled()).resolves.toBe(true);
  });

  it('getAdminSettings returns null when no row', async () => {
    repository.findLatest.mockResolvedValue(null);
    await expect(service.getAdminSettings()).resolves.toBeNull();
  });

  it('getAdminSettings maps admin fields when row exists', async () => {
    const row = makeVenueLayoutSettingsRow();
    repository.findLatest.mockResolvedValue(row);
    const result = await service.getAdminSettings();
    expect(result?.id).toBe('settings-1');
    expect(result?.promoImagePublicId).toBeNull();
    expect(result?.createdAt).toBe(row.createdAt.toISOString());
  });

  it('upsertAdminSettings creates when missing', async () => {
    const row = makeVenueLayoutSettingsRow({ promoTitle: 'Hello' });
    repository.findLatest.mockResolvedValue(null);
    repository.create.mockResolvedValue(row);
    const result = await service.upsertAdminSettings({ promoTitle: 'Hello' });
    expect(result.message).toBe('On Coming Events settings saved.');
    expect(result.settings.promoTitle).toBe('Hello');
  });

  it('upsertAdminSettings updates existing row', async () => {
    const existing = makeVenueLayoutSettingsRow({ promoTitle: 'Old' });
    const saved = makeVenueLayoutSettingsRow({ promoTitle: 'New title' });
    repository.findLatest.mockResolvedValue(existing);
    repository.update.mockResolvedValue(saved);

    const result = await service.upsertAdminSettings({
      promoTitle: 'New title',
    });
    expect(repository.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({ promoTitle: 'New title' }),
    );
    expect(result.settings.promoTitle).toBe('New title');
  });

  it('upsertAdminSettings syncs venue seat event dates when reservation date changes', async () => {
    const previousDate = new Date('2026-08-15T22:00:00.000Z');
    const nextDate = new Date('2026-09-01T22:00:00.000Z');
    const existing = makeVenueLayoutSettingsRow({
      reservationEventDate: previousDate,
    });
    const saved = makeVenueLayoutSettingsRow({
      reservationEventDate: nextDate,
    });
    repository.findLatest.mockResolvedValue(existing);
    repository.update.mockResolvedValue(saved);
    repository.findActiveVenueSeatingEvent.mockResolvedValue({ id: 'evt-1' });

    await service.upsertAdminSettings({
      reservationEventDate: nextDate.toISOString(),
    });

    expect(syncEventDatesMock).toHaveBeenCalledWith(
      prismaStub,
      'evt-1',
      nextDate,
    );
  });

  it('upsertAdminSettings skips event sync when date unchanged', async () => {
    const eventDate = new Date('2026-08-15T22:00:00.000Z');
    const existing = makeVenueLayoutSettingsRow({
      reservationEventDate: eventDate,
    });
    repository.findLatest.mockResolvedValue(existing);
    repository.update.mockResolvedValue(existing);

    await service.upsertAdminSettings({
      reservationEventDate: eventDate.toISOString(),
    });

    expect(syncEventDatesMock).not.toHaveBeenCalled();
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

  it('upsertAdminPromoMedia creates row when settings missing', async () => {
    const saved = makeVenueLayoutSettingsRow({
      promoImageUrl: 'https://cdn.example/promo.jpg',
      promoImagePublicId: 'shamell/on-coming-events/promo',
    });
    repository.findLatest.mockResolvedValue(null);
    repository.create.mockResolvedValue(saved);

    const result = await service.upsertAdminPromoMedia(makePromoMulterFile());
    expect(media.ensurePromoImageFile).toHaveBeenCalled();
    expect(result.message).toBe('Promo image updated.');
    expect(result.settings.promoImageUrl).toContain('promo.jpg');
  });

  it('upsertAdminPromoMedia replaces existing promo and deletes old asset', async () => {
    const existing = makeVenueLayoutSettingsRow({
      promoImagePublicId: 'shamell/old-promo',
    });
    const saved = makeVenueLayoutSettingsRow({
      promoImageUrl: 'https://cdn.example/promo.jpg',
      promoImagePublicId: 'shamell/on-coming-events/promo',
    });
    repository.findLatest.mockResolvedValue(existing);
    repository.update.mockResolvedValue(saved);

    await service.upsertAdminPromoMedia(makePromoMulterFile());
    expect(media.deleteImage).toHaveBeenCalledWith('shamell/old-promo');
  });

  it('upsertAdminPromoMedia cleans up upload when persist fails', async () => {
    repository.findLatest.mockResolvedValue(null);
    repository.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.upsertAdminPromoMedia(makePromoMulterFile()),
    ).rejects.toThrow('db down');
    expect(media.deleteImage).toHaveBeenCalledWith(
      'shamell/on-coming-events/promo',
    );
  });

  it('deleteAdminPromoMedia removes image and clears fields', async () => {
    const existing = makeVenueLayoutSettingsRow({
      promoImageUrl: 'https://cdn.example/promo.jpg',
      promoImagePublicId: 'shamell/promo',
    });
    const saved = makeVenueLayoutSettingsRow({
      promoImageUrl: null,
      promoImagePublicId: null,
    });
    repository.findLatest.mockResolvedValue(existing);
    repository.update.mockResolvedValue(saved);

    const result = await service.deleteAdminPromoMedia();
    expect(media.deleteImage).toHaveBeenCalledWith('shamell/promo');
    expect(result.message).toBe('Promo image removed.');
    expect(result.settings.promoImageUrl).toBeNull();
  });

  it('deleteAdminPromoMedia rejects when settings missing', async () => {
    repository.findLatest.mockResolvedValue(null);
    await expect(service.deleteAdminPromoMedia()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deleteAdminPromoMedia rejects when no promo image stored', async () => {
    repository.findLatest.mockResolvedValue(
      makeVenueLayoutSettingsRow({
        promoImageUrl: null,
        promoImagePublicId: null,
      }),
    );
    await expect(service.deleteAdminPromoMedia()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
