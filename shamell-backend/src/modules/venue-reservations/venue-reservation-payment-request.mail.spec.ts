import {
  buildVenueReservationPaymentRequestHtml,
  buildVenueReservationPaymentRequestSubject,
  buildVenueReservationPaymentRequestText,
} from './venue-reservation-payment-request.mail';

describe('venue-reservation-payment-request.mail', () => {
  const input = {
    recipientName: 'Jane Guest',
    appPublicName: 'Shamell Entertainment',
    frontendBaseUrl: 'https://example.com',
    reservationReference: 'ABCD1234',
    eventLabel: 'Summer Gala',
    seatLabel: 'Large table 1',
    amountUsd: '$120.00',
    payUrl: 'https://example.com/pay/venue-seat?token=abc',
  };

  it('builds subject and body with pay link', () => {
    expect(buildVenueReservationPaymentRequestSubject(input.appPublicName)).toContain(
      'seat reservation',
    );
    const html = buildVenueReservationPaymentRequestHtml(input);
    expect(html).toContain(input.payUrl);
    expect(html).toContain(input.amountUsd);
    expect(html).toContain('prefers-color-scheme: dark');
    const text = buildVenueReservationPaymentRequestText(input);
    expect(text).toContain(input.payUrl);
    expect(text).toContain(input.seatLabel);
    expect(html).toContain('Booking reference:');
    expect(text).toContain('Booking reference: ABCD1234');
  });
});
