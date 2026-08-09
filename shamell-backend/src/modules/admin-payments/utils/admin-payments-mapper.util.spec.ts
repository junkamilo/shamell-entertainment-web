import {
  makeBookingPaymentRow,
  makeClassRow,
  makeFixedRow,
  makePackageRow,
  makeVenueRow,
} from '../__mocks__/admin-payments.fixtures';
import {
  buildVenuePaymentRow,
  mapBookingPayment,
  mapBookingPaymentDetail,
  mapClassEnrollment,
  mapClassEnrollmentDetail,
  mapClassPackageEnrollment,
  mapFixedEnrollment,
  mapFixedEnrollmentDetail,
  packagePaymentFlow,
} from './admin-payments-mapper.util';

describe('admin-payments-mapper.util', () => {
  it('maps booking list row', () => {
    const row = mapBookingPayment(makeBookingPaymentRow());
    expect(row).toMatchObject({
      id: 'bp-1',
      flow: 'BOOKING_QUOTE',
      status: 'PAID',
      stage: 'DEPOSIT',
      amount: 150,
      customerName: 'Ada Lovelace',
      customerEmail: 'ada@example.com',
      contextLabel: 'Wedding',
      bookingId: 'booking-1',
    });
  });

  it('maps booking detail with purchaseDetails', () => {
    const detail = mapBookingPaymentDetail(makeBookingPaymentRow());
    expect(detail.purchaseDetails).toMatchObject({
      flow: 'BOOKING_QUOTE',
      eventType: 'Wedding',
      occasion: 'Anniversary',
      services: 'Dance · Live music',
      guestCount: 80,
    });
    expect(detail.customerPhone).toBe('+15551212');
  });

  it('builds venue row with seat label', () => {
    const row = buildVenuePaymentRow(makeVenueRow(), 'Table A1');
    expect(row.flow).toBe('VENUE_SEAT');
    expect(row.contextLabel).toContain('Table A1');
    expect(row.reservationId).toBe('vsr-1');
  });

  it('maps class session row and detail', () => {
    const enrollment = makeClassRow();
    const row = mapClassEnrollment(enrollment);
    expect(row).toMatchObject({
      flow: 'CLASS_SESSION',
      contextLabel: 'Bachata',
      eventId: 'event-class-1',
    });
    const detail = mapClassEnrollmentDetail(enrollment);
    expect(detail.purchaseDetails.flow).toBe('CLASS_SESSION');
    expect(detail.purchaseDetails).toMatchObject({
      eventName: 'Bachata',
      sessionTimezone: 'America/New_York',
    });
  });

  it('maps fixed ticket row and detail', () => {
    const enrollment = makeFixedRow();
    const row = mapFixedEnrollment(enrollment);
    expect(row.contextLabel).toContain('Ticket #12');
    const detail = mapFixedEnrollmentDetail(enrollment);
    expect(detail.purchaseDetails).toMatchObject({
      flow: 'FIXED_TICKET',
      ticketNumber: 12,
    });
  });

  it('maps package flows from selections.kind', () => {
    const pkg = makePackageRow();
    expect(packagePaymentFlow(pkg)).toBe('CLASS_PACKAGE');
    const mapped = mapClassPackageEnrollment(pkg, 'CLASS_PACKAGE');
    expect(mapped.flow).toBe('CLASS_PACKAGE');
    expect(mapped.contextLabel).toContain('class package');

    const bundle = makePackageRow({
      selections: { kind: 'class_session_bundle', dateIso: '2026-07-10' },
      items: [{ id: 'a' }],
    });
    expect(packagePaymentFlow(bundle)).toBe('CLASS_DAY_BUNDLE');
    const mappedBundle = mapClassPackageEnrollment(bundle, 'CLASS_DAY_BUNDLE');
    expect(mappedBundle.contextLabel).toContain('section(s)');
  });
});
