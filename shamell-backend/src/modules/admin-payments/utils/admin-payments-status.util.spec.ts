import {
  BookingPaymentStatus,
  UpcomingClassEnrollmentStatus,
  VenueSeatReservationStatus,
} from '@prisma/client';
import {
  mapBookingPaymentStatus,
  mapEnrollmentStatus,
  mapVenueStatus,
} from './admin-payments-status.util';

describe('admin-payments-status.util', () => {
  it('maps venue statuses', () => {
    expect(mapVenueStatus(VenueSeatReservationStatus.PENDING_PAYMENT)).toBe(
      'PENDING',
    );
    expect(mapVenueStatus(VenueSeatReservationStatus.PAID)).toBe('PAID');
    expect(mapVenueStatus(VenueSeatReservationStatus.EXPIRED)).toBe('EXPIRED');
    expect(mapVenueStatus(VenueSeatReservationStatus.CANCELLED)).toBe(
      'CANCELLED',
    );
  });

  it('maps enrollment statuses', () => {
    expect(
      mapEnrollmentStatus(UpcomingClassEnrollmentStatus.PENDING_PAYMENT),
    ).toBe('PENDING');
    expect(mapEnrollmentStatus(UpcomingClassEnrollmentStatus.PAID)).toBe(
      'PAID',
    );
    expect(mapEnrollmentStatus(UpcomingClassEnrollmentStatus.EXPIRED)).toBe(
      'EXPIRED',
    );
    expect(mapEnrollmentStatus(UpcomingClassEnrollmentStatus.CANCELLED)).toBe(
      'CANCELLED',
    );
  });

  it('maps booking payment status 1:1', () => {
    expect(mapBookingPaymentStatus(BookingPaymentStatus.PAID)).toBe('PAID');
    expect(mapBookingPaymentStatus(BookingPaymentStatus.PENDING)).toBe(
      'PENDING',
    );
  });
});
