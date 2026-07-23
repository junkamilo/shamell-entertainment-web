import type {
  AdminStripePaymentDetail,
  AdminStripePaymentRow,
} from "../../types/paymentHistory.types";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_CHECKOUT_SESSION_ID,
  FIXTURE_PAYMENT_ID,
  FIXTURE_PAYMENT_ID_2,
} from "./uuids.fixture";

export function makePaymentRow(
  overrides: Partial<AdminStripePaymentRow> = {},
): AdminStripePaymentRow {
  return {
    id: FIXTURE_PAYMENT_ID,
    flow: "BOOKING_QUOTE",
    status: "PAID",
    stage: "FULL",
    amount: 150,
    currency: "usd",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    contextLabel: "Private event booking",
    bookingId: FIXTURE_BOOKING_ID,
    eventSlug: null,
    eventId: null,
    reservationId: null,
    stripeCheckoutSessionId: FIXTURE_CHECKOUT_SESSION_ID,
    paymentMethodLabel: "Visa •••• 4242",
    createdAt: "2026-07-20T12:00:00.000Z",
    paidAt: "2026-07-20T12:05:00.000Z",
    expiresAt: null,
    updatedAt: "2026-07-20T12:05:00.000Z",
    ...overrides,
  };
}

export function makePaymentDetail(
  overrides: Partial<AdminStripePaymentDetail> = {},
): AdminStripePaymentDetail {
  const row = makePaymentRow(overrides);
  return {
    ...row,
    customerPhone: "555-0100",
    purchaseDetails: {
      flow: "BOOKING_QUOTE",
      eventType: "Show",
      occasion: "Birthday",
      services: "Dance",
      eventDate: "2026-08-15T20:00:00.000Z",
      location: "Studio A",
      guestCount: 20,
      quoteTotalAmount: 500,
      quoteDepositAmount: 150,
      quoteModel: "DEPOSIT",
    },
    ...overrides,
  };
}

export function makePaymentsList(items: AdminStripePaymentRow[] = [
  makePaymentRow(),
  makePaymentRow({
    id: FIXTURE_PAYMENT_ID_2,
    flow: "VENUE_SEAT",
    status: "PENDING",
    stage: null,
    customerName: "Guest Two",
    customerEmail: "two@example.com",
    contextLabel: "Table T1",
    amount: 80,
    paidAt: null,
    expiresAt: "2026-07-21T12:00:00.000Z",
  }),
]) {
  return {
    items,
    meta: {
      page: 1,
      limit: 20,
      totalItems: items.length,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
  };
}
