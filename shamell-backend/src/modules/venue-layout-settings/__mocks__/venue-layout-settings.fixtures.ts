import type { VenueLayoutSettingsRow } from '../types/venue-layout-settings.types';

export function makeVenueLayoutSettingsRow(
  overrides: Partial<VenueLayoutSettingsRow> = {},
): VenueLayoutSettingsRow {
  const now = new Date('2026-07-01T00:00:00.000Z');
  return {
    id: 'settings-1',
    clientEnabled: true,
    promoTitle: 'On Coming Events',
    promoDescription: 'Join us',
    promoImageUrl: null,
    promoImagePublicId: null,
    reservationEventDate: new Date('2026-08-15T22:00:00.000Z'),
    reservationOpensAt: new Date('2026-06-12T04:00:00.000Z'),
    reservationClosesAt: new Date('2026-08-16T03:59:59.999Z'),
    reservationEventLabel: 'Gala Night',
    reservationTimezone: 'America/New_York',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makePromoMulterFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'media',
    originalname: 'promo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 100,
    buffer: Buffer.from('fake-image'),
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
    ...overrides,
  };
}
