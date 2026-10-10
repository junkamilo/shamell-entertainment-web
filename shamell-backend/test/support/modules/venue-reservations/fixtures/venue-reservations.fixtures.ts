import {
  VenueSeatKind,
  VenueSeatReservationStatus,
  VenueTableSize,
} from '@prisma/client';

export function makeVenueSeatReservationLite(
  overrides: Partial<{
    id: string;
    status: VenueSeatReservationStatus;
    kind: VenueSeatKind;
    stripeCheckoutSessionId: string | null;
    payTokenHash: string | null;
    upcomingEventId: string;
    layoutItemId: string;
    amount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    customerEmailSentAt: Date | null;
    venueTableConfigId: string | null;
    paidAt: Date | null;
    expiresAt: Date | null;
    customerPhone: string | null;
    eventDate: Date;
  }> = {},
) {
  return {
    id: 'res-1',
    status: VenueSeatReservationStatus.PENDING_PAYMENT,
    kind: VenueSeatKind.CATALOG_TABLE,
    stripeCheckoutSessionId: 'cs_test_1',
    payTokenHash: null,
    upcomingEventId: 'event-1',
    layoutItemId: 'item-1',
    amount: 100,
    currency: 'usd',
    customerName: 'Guest',
    customerEmail: 'guest@example.com',
    customerEmailSentAt: null,
    venueTableConfigId: 'table-1',
    customerPhone: null,
    eventDate: new Date('2026-08-15T22:00:00.000Z'),
    paidAt: null,
    expiresAt: new Date(Date.now() + 86_400_000),
    venueTableConfig: { tableName: 'T1', size: VenueTableSize.LARGE },
    ...overrides,
  };
}

export function makePaidVenueReservationStub(
  overrides: Record<string, unknown> = {},
) {
  return makeVenueSeatReservationLite({
    status: VenueSeatReservationStatus.PAID,
    paidAt: new Date(),
    customerEmailSentAt: new Date(),
    ...overrides,
  });
}

export function makeCancelledVenueReservationStub(
  overrides: Record<string, unknown> = {},
) {
  return makeVenueSeatReservationLite({
    status: VenueSeatReservationStatus.CANCELLED,
    ...overrides,
  });
}

export function makeCheckoutSessionStub(
  overrides: Partial<{
    id: string;
    metadata: Record<string, string>;
    payment_status: string;
    status: string;
    amount_total: number;
    currency: string;
    client_secret: string | null;
    payment_intent: string | null;
  }> = {},
) {
  return {
    id: 'cs_test_1',
    metadata: { flow: 'venue_seat' },
    payment_status: 'unpaid',
    status: 'open',
    amount_total: 10_000,
    currency: 'usd',
    client_secret: 'cs_test_secret',
    payment_intent: 'pi_test_1',
    ...overrides,
  };
}

export function makePaidCheckoutSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return makeCheckoutSessionStub({
    status: 'complete',
    payment_status: 'paid',
    amount_total: 10_000,
    currency: 'usd',
    metadata: { flow: 'venue_seat' },
    ...overrides,
  });
}

/** Completed session that is not paid (payment failure path). */
export function makeUnpaidCompletedCheckoutSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return makeCheckoutSessionStub({
    id: 'cs_unpaid_complete',
    status: 'complete',
    payment_status: 'unpaid',
    amount_total: 10_000,
    currency: 'usd',
    metadata: { flow: 'venue_seat' },
    ...overrides,
  });
}

/** Stripe checkout session in expired state. */
export function makeExpiredCheckoutSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return makeCheckoutSessionStub({
    id: 'cs_expired',
    status: 'expired',
    payment_status: 'unpaid',
    client_secret: null,
    metadata: { flow: 'venue_seat' },
    ...overrides,
  });
}

/**
 * Paid session whose amount does not match reservation.amount (e.g. $50 vs $100).
 * Omits amount_subtotal so assertCheckoutPaidAmounts compares amount_total.
 */
export function makeAmountMismatchCheckoutSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return makeCheckoutSessionStub({
    id: 'cs_mismatch',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 5_000,
    currency: 'usd',
    metadata: { flow: 'venue_seat' },
    ...overrides,
  });
}

/** PENDING reservation whose pay-token / checkout TTL has already elapsed. */
export function makeExpiredPayTokenReservationStub(
  overrides: Record<string, unknown> = {},
) {
  return makeVenueSeatReservationLite({
    id: 'res-pay-expired',
    status: VenueSeatReservationStatus.PENDING_PAYMENT,
    stripeCheckoutSessionId: 'cs_pay_expired',
    payTokenHash: 'hash-expired',
    expiresAt: new Date(Date.now() - 60_000),
    ...overrides,
  });
}

export function makeVenueConfigStub(overrides: Record<string, unknown> = {}) {
  const opensAt = new Date(Date.now() - 86_400_000);
  const closesAt = new Date(Date.now() + 86_400_000 * 30);
  const eventDate = new Date(Date.now() + 86_400_000 * 14);
  return {
    eventId: 'event-1',
    clientEnabled: true,
    floorLayoutId: 'layout-1',
    reservationOpensAt: opensAt,
    reservationClosesAt: closesAt,
    reservationEventDate: eventDate,
    reservationEventLabel: 'Gala Night',
    reservationTimezone: 'America/New_York',
    reservationEventTemplate: null,
    ...overrides,
  };
}

export function makeVenueEventStub(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    slug: 'gala-night',
    isActive: true,
    publicSection: 'UPCOMING_EVENTS',
    experienceType: 'VENUE_SEATING',
    venueConfig: makeVenueConfigStub(),
    ...overrides,
  };
}

export function makeCatalogTableLayoutItem(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'item-1',
    kind: 'catalog_table',
    venueTableConfigId: 'table-1',
    venueStandaloneChairId: null,
    ...overrides,
  };
}

export function makeFloorLayoutStub(
  items: Array<Record<string, unknown>> = [makeCatalogTableLayoutItem()],
) {
  return { items };
}

export function makeVenueTableConfigStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'table-1',
    tableName: 'Table 1',
    size: VenueTableSize.LARGE,
    sortOrder: 0,
    bundlePrice: 100,
    isActive: true,
    ...overrides,
  };
}
