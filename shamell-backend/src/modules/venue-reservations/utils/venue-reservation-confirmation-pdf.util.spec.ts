import { buildVenueReservationConfirmationPdf } from './venue-reservation-confirmation-pdf.util';

describe('buildVenueReservationConfirmationPdf', () => {
  it('returns a non-empty PDF buffer', async () => {
    const pdf = await buildVenueReservationConfirmationPdf({
      appPublicName: 'Shamell Entertainment',
      recipientName: 'Ada',
      reservationKindLabel: 'Table',
      layoutItemLabel: 'Table 1',
      eventDate: new Date('2026-08-15T00:00:00.000Z'),
      reservationTimezone: 'America/New_York',
    });

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(100);
    expect(pdf.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });
});
