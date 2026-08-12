import { Prisma, StripeWebhookProcessingStatus } from '@prisma/client';
import {
  bookingPaymentRelatedSelect,
  classEnrollmentRelatedSelect,
  fixedEnrollmentRelatedSelect,
  packageEnrollmentRelatedSelect,
  venueReservationRelatedSelect,
} from '../constants/admin-stripe-webhooks.constants';
import type {
  AdminStripeWebhookEventRow,
  AdminStripeWebhookRelatedPayment,
} from '../types/admin-stripe-webhooks.types';

export type BookingPaymentRelated = Prisma.BookingPaymentGetPayload<{
  select: typeof bookingPaymentRelatedSelect;
}>;

export type ClassEnrollmentRelated = Prisma.UpcomingClassEnrollmentGetPayload<{
  select: typeof classEnrollmentRelatedSelect;
}>;

export type PackageEnrollmentRelated =
  Prisma.UpcomingClassPackageEnrollmentGetPayload<{
    select: typeof packageEnrollmentRelatedSelect;
  }>;

export type FixedEnrollmentRelated =
  Prisma.UpcomingFixedEventEnrollmentGetPayload<{
    select: typeof fixedEnrollmentRelatedSelect;
  }>;

export type VenueReservationRelated = Prisma.VenueSeatReservationGetPayload<{
  select: typeof venueReservationRelatedSelect;
}>;

export type RelatedPaymentSources = {
  bookingPayment: BookingPaymentRelated | null;
  classEnrollment: ClassEnrollmentRelated | null;
  packageEnrollment: PackageEnrollmentRelated | null;
  fixedEnrollment: FixedEnrollmentRelated | null;
  venueReservation: VenueReservationRelated | null;
};

export type StripeWebhookEventPrismaRow = {
  id: string;
  eventId: string;
  eventType: string;
  livemode: boolean;
  status: StripeWebhookProcessingStatus;
  metadataFlow: string | null;
  checkoutSessionId: string | null;
  purchaseCorrelationId: string | null;
  handler: string | null;
  payloadSummary: Prisma.JsonValue;
  payload: Prisma.JsonValue | null;
  processedAt: Date | null;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function jsonObjectOrNull(
  value: Prisma.JsonValue | null | undefined,
): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null;
}

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function toRow(
  row: StripeWebhookEventPrismaRow,
): AdminStripeWebhookEventRow {
  return {
    id: row.id,
    eventId: row.eventId,
    eventType: row.eventType,
    livemode: row.livemode,
    status: row.status,
    metadataFlow: row.metadataFlow,
    checkoutSessionId: row.checkoutSessionId,
    purchaseCorrelationId: row.purchaseCorrelationId,
    handler: row.handler,
    payloadSummary: jsonObjectOrNull(row.payloadSummary),
    processedAt: iso(row.processedAt),
    attempts: row.attempts,
    lastError: row.lastError,
    createdAt: iso(row.createdAt) ?? '',
    updatedAt: iso(row.updatedAt) ?? '',
  };
}

export function toDetailRow(row: StripeWebhookEventPrismaRow): {
  payload: Record<string, unknown> | null;
} & ReturnType<typeof toRow> {
  return {
    ...toRow(row),
    payload: jsonObjectOrNull(row.payload),
  };
}

export function mapRelatedPaymentsFromSources(
  sources: RelatedPaymentSources,
): AdminStripeWebhookRelatedPayment[] {
  const results: AdminStripeWebhookRelatedPayment[] = [];
  const {
    bookingPayment,
    classEnrollment,
    packageEnrollment,
    fixedEnrollment,
    venueReservation,
  } = sources;

  if (bookingPayment) {
    results.push({
      kind: 'booking_payment',
      id: bookingPayment.id,
      status: bookingPayment.status,
      customerEmail: bookingPayment.booking.user?.email ?? null,
      amount: bookingPayment.expectedAmount.toString(),
      currency: bookingPayment.currency,
      paidAt: iso(bookingPayment.paidAt),
    });
  }
  if (classEnrollment) {
    results.push({
      kind: 'class_enrollment',
      id: classEnrollment.id,
      status: classEnrollment.status,
      customerEmail: classEnrollment.customerEmail,
      amount: classEnrollment.amount.toString(),
      currency: classEnrollment.currency,
      paidAt: iso(classEnrollment.paidAt),
    });
  }
  if (packageEnrollment) {
    results.push({
      kind: 'class_package_enrollment',
      id: packageEnrollment.id,
      status: packageEnrollment.status,
      customerEmail: packageEnrollment.customerEmail,
      amount: packageEnrollment.amount.toString(),
      currency: packageEnrollment.currency,
      paidAt: iso(packageEnrollment.paidAt),
    });
  }
  if (fixedEnrollment) {
    results.push({
      kind: 'fixed_event_enrollment',
      id: fixedEnrollment.id,
      status: fixedEnrollment.status,
      customerEmail: fixedEnrollment.customerEmail,
      amount: fixedEnrollment.amount.toString(),
      currency: fixedEnrollment.currency,
      paidAt: iso(fixedEnrollment.paidAt),
    });
  }
  if (venueReservation) {
    results.push({
      kind: 'venue_seat_reservation',
      id: venueReservation.id,
      status: venueReservation.status,
      customerEmail: venueReservation.customerEmail,
      amount: venueReservation.amount.toString(),
      currency: venueReservation.currency,
      paidAt: iso(venueReservation.paidAt),
    });
  }

  return results;
}

export function emptyRelatedPaymentSources(): RelatedPaymentSources {
  return {
    bookingPayment: null,
    classEnrollment: null,
    packageEnrollment: null,
    fixedEnrollment: null,
    venueReservation: null,
  };
}
