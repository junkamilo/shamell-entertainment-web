import {
  makeBookingPaymentRelated,
  makeClassEnrollmentRelated,
  makePrismaWebhookEvent,
  makeRelatedSources,
  makeVenueReservationRelated,
} from '../__mocks__/admin-stripe-webhooks.fixtures';
import {
  emptyRelatedPaymentSources,
  mapRelatedPaymentsFromSources,
  toRow,
} from './admin-stripe-webhooks-mapper.util';

describe('admin-stripe-webhooks-mapper.util', () => {
  it('toRow maps dates and object payloadSummary', () => {
    const row = toRow(
      makePrismaWebhookEvent({
        payloadSummary: { foo: 'bar' },
      }),
    );
    expect(row.payloadSummary).toEqual({ foo: 'bar' });
    expect(row.processedAt).toBe('2026-07-15T12:00:00.000Z');
    expect(row.status).toBe('PROCESSED');
  });

  it('toRow nulls non-object payloadSummary', () => {
    const row = toRow(makePrismaWebhookEvent({ payloadSummary: 'x' as never }));
    expect(row.payloadSummary).toBeNull();
  });

  it('mapRelatedPaymentsFromSources returns empty for empty sources', () => {
    expect(mapRelatedPaymentsFromSources(emptyRelatedPaymentSources())).toEqual(
      [],
    );
  });

  it('maps booking, class, and venue related payments', () => {
    const mapped = mapRelatedPaymentsFromSources(
      makeRelatedSources({
        bookingPayment: makeBookingPaymentRelated(),
        classEnrollment: makeClassEnrollmentRelated(),
        venueReservation: makeVenueReservationRelated(),
      }),
    );
    expect(mapped).toHaveLength(3);
    expect(mapped[0]).toMatchObject({
      kind: 'booking_payment',
      customerEmail: 'ada@example.com',
      amount: '150',
    });
    expect(mapped[1]).toMatchObject({
      kind: 'class_enrollment',
      customerEmail: 'marie@example.com',
    });
    expect(mapped[2]).toMatchObject({
      kind: 'venue_seat_reservation',
      id: 'vsr-1',
    });
  });
});
