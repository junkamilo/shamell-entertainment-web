import {
  BookingPaymentStatus,
  UpcomingClassEnrollmentStatus,
  VenueSeatReservationStatus,
} from '@prisma/client';
import type { AdminPaymentStatus } from '../dto/admin-payments-query.dto';

export function mapVenueStatus(
  status: VenueSeatReservationStatus,
): AdminPaymentStatus {
  if (status === VenueSeatReservationStatus.PENDING_PAYMENT) return 'PENDING';
  if (status === VenueSeatReservationStatus.PAID) return 'PAID';
  if (status === VenueSeatReservationStatus.EXPIRED) return 'EXPIRED';
  return 'CANCELLED';
}

export function mapEnrollmentStatus(
  status: UpcomingClassEnrollmentStatus,
): AdminPaymentStatus {
  if (status === UpcomingClassEnrollmentStatus.PENDING_PAYMENT) {
    return 'PENDING';
  }
  if (status === UpcomingClassEnrollmentStatus.PAID) return 'PAID';
  if (status === UpcomingClassEnrollmentStatus.EXPIRED) return 'EXPIRED';
  return 'CANCELLED';
}

export function mapBookingPaymentStatus(
  status: BookingPaymentStatus,
): AdminPaymentStatus {
  return status;
}
