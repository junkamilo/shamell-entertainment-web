import { Prisma, VenueSeatKind } from '@prisma/client';
import { formatPaymentMethodLabel } from '../../stripe/utils/stripe-payment-details.util';
import { fixedEventStartsAtIso } from '../../upcoming-events/utils/upcoming-fixed-ticket.util';
import {
  bookingPaymentInclude,
  classInclude,
  fixedInclude,
  packageInclude,
  venueInclude,
} from '../constants/admin-payments.constants';
import type {
  AdminStripePaymentDetail,
  BookingPurchaseDetails,
  ClassPurchaseDetails,
  FixedPurchaseDetails,
  VenuePurchaseDetails,
} from '../types/admin-payments-detail.types';
import type { AdminStripePaymentRow } from '../types/admin-payments.types';
import {
  mapBookingPaymentStatus,
  mapEnrollmentStatus,
  mapVenueStatus,
} from './admin-payments-status.util';

export type PackageRow = Prisma.UpcomingClassPackageEnrollmentGetPayload<{
  include: typeof packageInclude;
}>;

export type BookingPaymentRow = Prisma.BookingPaymentGetPayload<{
  include: typeof bookingPaymentInclude;
}>;

export type VenueRow = Prisma.VenueSeatReservationGetPayload<{
  include: typeof venueInclude;
}>;

export type ClassRow = Prisma.UpcomingClassEnrollmentGetPayload<{
  include: typeof classInclude;
}>;

export type FixedRow = Prisma.UpcomingFixedEventEnrollmentGetPayload<{
  include: typeof fixedInclude;
}>;

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function paymentLabelFromRow(row: {
  paymentMethodType: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}): string | null {
  return formatPaymentMethodLabel({
    paymentMethodType: row.paymentMethodType,
    paymentMethodBrand: row.paymentMethodBrand,
    paymentMethodLast4: row.paymentMethodLast4,
  });
}

export function packagePaymentFlow(
  row: PackageRow,
): 'CLASS_PACKAGE' | 'CLASS_DAY_BUNDLE' {
  const kind =
    row.selections &&
    typeof row.selections === 'object' &&
    !Array.isArray(row.selections)
      ? (row.selections as { kind?: string }).kind
      : undefined;
  return kind === 'class_session_bundle' ? 'CLASS_DAY_BUNDLE' : 'CLASS_PACKAGE';
}

export function mapClassPackageEnrollment(
  pkg: PackageRow,
  flow: 'CLASS_PACKAGE' | 'CLASS_DAY_BUNDLE',
): AdminStripePaymentRow {
  const event = pkg.event;
  const selections =
    pkg.selections &&
    typeof pkg.selections === 'object' &&
    !Array.isArray(pkg.selections)
      ? (pkg.selections as {
          kind?: string;
          monthIso?: string;
          dateIso?: string;
          sessionCount?: number;
        })
      : {};
  const sessionCount =
    pkg.items.length > 0 ? pkg.items.length : (selections.sessionCount ?? 0);
  const contextLabel =
    flow === 'CLASS_DAY_BUNDLE'
      ? `${event.eventType.name} — ${sessionCount} section(s) on ${selections.dateIso ?? 'selected day'}`
      : `${event.eventType.name} — class package (${sessionCount} sessions)`;

  return {
    id: pkg.id,
    flow,
    status: mapEnrollmentStatus(pkg.status),
    stage: null,
    amount: Number(pkg.amount),
    currency: pkg.currency,
    customerName: pkg.customerName,
    customerEmail: pkg.customerEmail,
    contextLabel,
    bookingId: null,
    eventSlug: event.slug ?? null,
    eventId: event.id,
    reservationId: null,
    stripeCheckoutSessionId: pkg.stripeCheckoutSessionId,
    paymentMethodLabel: paymentLabelFromRow(pkg),
    createdAt: pkg.createdAt.toISOString(),
    paidAt: iso(pkg.paidAt),
    expiresAt: iso(pkg.expiresAt),
    updatedAt: pkg.updatedAt.toISOString(),
  };
}

export function mapBookingPayment(p: BookingPaymentRow): AdminStripePaymentRow {
  const b = p.booking;
  const customerName =
    b.user?.fullName?.trim() || b.guestFullName?.trim() || 'Client';
  const customerEmail =
    b.user?.email?.trim().toLowerCase() ||
    b.guestEmail?.trim().toLowerCase() ||
    '';
  const contextLabel =
    b.eventType?.name ||
    b.event?.eventType?.name ||
    b.service?.serviceType?.name ||
    `Booking ${b.id.slice(0, 8).toUpperCase()}`;

  return {
    id: p.id,
    flow: 'BOOKING_QUOTE',
    status: mapBookingPaymentStatus(p.status),
    stage: p.stage,
    amount: Number(p.expectedAmount),
    currency: p.currency,
    customerName,
    customerEmail,
    contextLabel,
    bookingId: b.id,
    eventSlug: b.event?.slug ?? null,
    eventId: b.eventId,
    reservationId: null,
    stripeCheckoutSessionId: p.stripeCheckoutSessionId,
    paymentMethodLabel: null,
    createdAt: p.createdAt.toISOString(),
    paidAt: iso(p.paidAt),
    expiresAt: iso(p.expiresAt),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function buildVenuePaymentRow(
  r: VenueRow,
  seatLabel: string,
): AdminStripePaymentRow {
  const kindLabel =
    r.kind === VenueSeatKind.STANDALONE_CHAIR ? 'Chair' : 'Table';
  const seatSuffix = seatLabel ? ` — ${seatLabel}` : '';
  const eventName = r.upcomingEvent?.eventType?.name ?? 'Venue event';

  return {
    id: r.id,
    flow: 'VENUE_SEAT',
    status: mapVenueStatus(r.status),
    stage: null,
    amount: Number(r.amount),
    currency: r.currency,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    contextLabel: `${eventName} (${kindLabel}${seatSuffix})`,
    bookingId: null,
    eventSlug: r.upcomingEvent?.slug ?? null,
    eventId: r.upcomingEventId,
    reservationId: r.id,
    stripeCheckoutSessionId: r.stripeCheckoutSessionId,
    paymentMethodLabel: paymentLabelFromRow(r),
    createdAt: r.createdAt.toISOString(),
    paidAt: iso(r.paidAt),
    expiresAt: iso(r.expiresAt),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function mapClassEnrollment(e: ClassRow): AdminStripePaymentRow {
  const event = e.session.event;
  return {
    id: e.id,
    flow: 'CLASS_SESSION',
    status: mapEnrollmentStatus(e.status),
    stage: null,
    amount: Number(e.amount),
    currency: e.currency,
    customerName: e.customerName,
    customerEmail: e.customerEmail,
    contextLabel: event.eventType.name,
    bookingId: null,
    eventSlug: event.slug ?? null,
    eventId: event.id,
    reservationId: null,
    stripeCheckoutSessionId: e.stripeCheckoutSessionId ?? '',
    paymentMethodLabel: paymentLabelFromRow(e),
    createdAt: e.createdAt.toISOString(),
    paidAt: iso(e.paidAt),
    expiresAt: iso(e.expiresAt),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export function mapFixedEnrollment(e: FixedRow): AdminStripePaymentRow {
  const event = e.event;
  const ticket = e.ticketNumber != null ? ` — Ticket #${e.ticketNumber}` : '';
  const pkg = e.packageTitle?.trim()
    ? ` — Package: ${e.packageTitle.trim()}`
    : '';
  return {
    id: e.id,
    flow: 'FIXED_TICKET',
    status: mapEnrollmentStatus(e.status),
    stage: null,
    amount: Number(e.amount),
    currency: e.currency,
    customerName: e.customerName,
    customerEmail: e.customerEmail,
    contextLabel: `${event.eventType.name}${pkg}${ticket}`,
    bookingId: null,
    eventSlug: event.slug ?? null,
    eventId: event.id,
    reservationId: null,
    stripeCheckoutSessionId: e.stripeCheckoutSessionId,
    paymentMethodLabel: paymentLabelFromRow(e),
    createdAt: e.createdAt.toISOString(),
    paidAt: iso(e.paidAt),
    expiresAt: iso(e.expiresAt),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export function bookingServicesLine(
  booking: BookingPaymentRow['booking'],
): string | null {
  const raw = booking.bookingDetails;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const labels = (raw as { serviceLabels?: unknown }).serviceLabels;
    if (Array.isArray(labels)) {
      const parts = labels.filter(
        (x): x is string => typeof x === 'string' && x.trim().length > 0,
      );
      if (parts.length > 0) return parts.join(' · ');
    }
  }
  return booking.service?.serviceType?.name ?? null;
}

export function mapBookingPaymentDetail(
  p: BookingPaymentRow,
): AdminStripePaymentDetail {
  const base = mapBookingPayment(p);
  const b = p.booking;
  const purchaseDetails: BookingPurchaseDetails = {
    flow: 'BOOKING_QUOTE',
    eventType:
      b.eventType?.name ?? b.event?.eventType?.name ?? base.contextLabel,
    occasion: b.occasionType?.name ?? null,
    services: bookingServicesLine(b),
    eventDate: b.eventDate.toISOString(),
    location: b.location?.trim() || null,
    guestCount: b.guestCount ?? null,
    quoteTotalAmount:
      b.quoteTotalAmount != null ? Number(b.quoteTotalAmount) : null,
    quoteDepositAmount:
      b.quoteDepositAmount != null ? Number(b.quoteDepositAmount) : null,
    quoteModel: b.quoteModel ?? null,
  };
  return {
    ...base,
    customerPhone: b.guestPhone?.trim() || null,
    purchaseDetails,
  };
}

export function mapVenueReservationDetail(
  r: VenueRow,
  seatLabel: string,
): AdminStripePaymentDetail {
  const base = buildVenuePaymentRow(r, seatLabel);
  const eventName = r.upcomingEvent?.eventType?.name ?? 'Venue event';
  const purchaseDetails: VenuePurchaseDetails = {
    flow: 'VENUE_SEAT',
    eventName,
    eventDate: r.eventDate.toISOString(),
    seatKind: r.kind === VenueSeatKind.STANDALONE_CHAIR ? 'CHAIR' : 'TABLE',
    tableName: r.kind === VenueSeatKind.CATALOG_TABLE ? seatLabel : null,
    layoutItemId: r.layoutItemId,
  };
  return {
    ...base,
    customerPhone: r.customerPhone?.trim() || null,
    purchaseDetails,
  };
}

export function mapClassEnrollmentDetail(
  e: ClassRow,
): AdminStripePaymentDetail {
  const base = mapClassEnrollment(e);
  const session = e.session;
  const purchaseDetails: ClassPurchaseDetails = {
    flow: 'CLASS_SESSION',
    eventName: session.event.eventType.name,
    sessionStartsAt: session.startsAt.toISOString(),
    sessionEndsAt: session.endsAt.toISOString(),
    sessionTimezone: session.timezone,
  };
  return {
    ...base,
    customerPhone: e.customerPhone?.trim() || null,
    purchaseDetails,
  };
}

export function mapFixedEnrollmentDetail(
  e: FixedRow,
): AdminStripePaymentDetail {
  const base = mapFixedEnrollment(e);
  const event = e.event;
  const inclusions = Array.isArray(e.packageInclusions)
    ? (e.packageInclusions as { title?: string }[])
        .map((item) => item.title?.trim())
        .filter((title): title is string => Boolean(title))
    : [];
  const purchaseDetails: FixedPurchaseDetails = {
    flow: 'FIXED_TICKET',
    eventName: event.eventType.name,
    eventDate: fixedEventStartsAtIso(event.venueConfig?.reservationEventDate),
    ticketNumber: e.ticketNumber ?? null,
    packageTitle: e.packageTitle?.trim() || null,
    packageArrivalLabel: e.packageArrivalLabel?.trim() || null,
    packageIncludes: inclusions,
    verificationCode: e.id.trim().toLowerCase(),
  };
  return {
    ...base,
    customerPhone: e.customerPhone?.trim() || null,
    purchaseDetails,
  };
}
