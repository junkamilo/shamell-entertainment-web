import {
  buildVenueReservationConfirmationHtml,
  buildVenueReservationConfirmationText,
  VENUE_CONFIRMATION_PDF_BUTTON_LABEL,
  VENUE_TABLE_SHARE_REMINDER_EN,
} from './venue-reservation-confirmation.mail';

describe('venue-reservation-confirmation.mail', () => {
  const baseInput = {
    recipientName: 'Rossy',
    appPublicName: 'Shamell Entertainment',
    frontendBaseUrl: 'https://shamellentertainment.com',
    eventDate: new Date('2026-08-15T23:00:00.000Z'),
    reservationTimezone: 'America/New_York',
    reservationKindLabel: 'Table' as const,
    layoutItemLabel: 'Large table 4',
    pdfDownloadUrl:
      'https://api.example.com/api/v1/venue-reservations/public/confirmation.pdf?token=abc',
  };

  it('includes table share reminder and PDF button for table reservations', () => {
    const html = buildVenueReservationConfirmationHtml(baseInput);
    const text = buildVenueReservationConfirmationText(baseInput);

    expect(html).toContain(VENUE_TABLE_SHARE_REMINDER_EN);
    expect(html).toContain(VENUE_CONFIRMATION_PDF_BUTTON_LABEL);
    expect(html).toContain(baseInput.pdfDownloadUrl);
    expect(text).toContain(VENUE_TABLE_SHARE_REMINDER_EN);
    expect(text).toContain(baseInput.pdfDownloadUrl);
  });

  it('omits share reminder and PDF button for chair reservations', () => {
    const html = buildVenueReservationConfirmationHtml({
      ...baseInput,
      reservationKindLabel: 'Chair',
      layoutItemLabel: 'Chair 21',
      pdfDownloadUrl: undefined,
    });

    expect(html).not.toContain(VENUE_TABLE_SHARE_REMINDER_EN);
    expect(html).not.toContain(VENUE_CONFIRMATION_PDF_BUTTON_LABEL);
  });
});
