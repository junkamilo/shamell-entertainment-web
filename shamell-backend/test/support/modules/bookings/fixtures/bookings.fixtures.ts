import {
  BookingQuotePaymentModel,
  BookingSource,
  BookingStatus,
  EventTypeCatalogChannel,
} from '@prisma/client';
import type { BookingWithRelations } from '../constants/booking-includes';

const NOW = new Date('2026-07-15T16:00:00.000Z');

export const ADMIN_BOOKING_GUEST_DTO = {
  serviceId: 'service-1',
  eventDate: '2026-07-15T16:00:00.000Z',
  location: 'Miami Beach',
  guestFullName: 'Ada Lovelace',
  guestEmail: 'ada@example.com',
  guestPhone: '+15551212',
  guestCount: 20,
} as const;

export const BOOKING_DETAILS_WINDOW = {
  eventTimeStart: '10:00',
  eventTimeEnd: '12:00',
} as const;

export const OVERLAPPING_SLOT_EXISTING = {
  eventDate: new Date('2026-07-15T14:00:00.000Z'),
  bookingDetails: {
    eventTimeStart: '10:00',
    eventTimeEnd: '12:00',
  },
} as const;

export function makeBookingWithRelations(
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations {
  return {
    id: 'booking-1',
    serviceId: 'service-1',
    eventTypeId: null,
    occasionTypeId: null,
    eventId: null,
    eventDate: NOW,
    location: 'Miami Beach',
    guestCount: 20,
    notes: null,
    status: BookingStatus.PENDING,
    bookingDetails: null,
    source: BookingSource.ADMIN_PHONE,
    createdByAdminId: 'admin-1',
    contactRequestId: null,
    userId: null,
    guestFullName: 'Ada Lovelace',
    guestEmail: 'ada@example.com',
    guestPhone: '+15551212',
    totalAmount: null,
    quoteModel: null,
    quoteTotalAmount: null,
    quoteDepositAmount: null,
    quoteBalanceAmount: null,
    quoteCurrency: null,
    quoteSentAt: null,
    quoteAcceptedAt: null,
    quoteRejectedAt: null,
    depositPaidAt: null,
    balancePaidAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    service: {
      id: 'service-1',
      serviceType: { id: 'st-1', name: 'Performance' } as never,
    } as never,
    bookingServices: [],
    eventType: null,
    occasionType: null,
    event: null,
    user: null,
    createdByAdmin: {
      id: 'admin-1',
      fullName: 'Admin',
      email: 'admin@example.com',
    },
    ...overrides,
  } as BookingWithRelations;
}

export function makeConfirmedBooking(
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations {
  return makeBookingWithRelations({
    status: BookingStatus.CONFIRMED,
    ...overrides,
  });
}

export function makeCancelledBooking(
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations {
  return makeBookingWithRelations({
    status: BookingStatus.CANCELLED,
    ...overrides,
  });
}

export function makeFullyPaidBooking(
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations {
  return makeBookingWithRelations({
    status: BookingStatus.CONFIRMED,
    quoteModel: BookingQuotePaymentModel.FULL,
    quoteTotalAmount: 500 as never,
    balancePaidAt: null,
    ...overrides,
  });
}

export function makeDepositQuoteBooking(
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations {
  return makeBookingWithRelations({
    status: BookingStatus.PENDING,
    quoteModel: BookingQuotePaymentModel.DEPOSIT,
    quoteTotalAmount: 500 as never,
    quoteDepositAmount: 150 as never,
    quoteBalanceAmount: 350 as never,
    quoteCurrency: 'usd',
    depositPaidAt: NOW,
    ...overrides,
  });
}

export function makeUpcomingHubMismatchBooking(): BookingWithRelations {
  return makeBookingWithRelations({
    eventType: {
      catalogChannel: EventTypeCatalogChannel.UPCOMING_HUB,
      name: 'Hub Type',
    } as never,
  });
}

export function makeMultiServiceBooking(
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations {
  return makeBookingWithRelations({
    bookingDetails: {
      serviceIds: ['service-1', 'service-2'],
      serviceLabels: ['Performance', 'Host'],
    },
    bookingServices: [
      { serviceId: 'service-1' },
      { serviceId: 'service-2' },
    ] as never,
    ...overrides,
  });
}

export function makeActiveQuoteRow(
  overrides: {
    id?: string;
    bookingId?: string;
    tokenExpiresAt?: Date;
    status?: string;
  } = {},
) {
  return {
    id: overrides.id ?? 'quote-1',
    bookingId: overrides.bookingId ?? 'booking-1',
    tokenExpiresAt:
      overrides.tokenExpiresAt ?? new Date(Date.now() + 72 * 60 * 60 * 1000),
    status: overrides.status ?? 'ACTIVE',
  };
}

export function makePendingQuotePayment(
  overrides: {
    id?: string;
    quoteId?: string;
    bookingId?: string;
    stage?: string;
    expectedAmount?: number;
    currency?: string;
    stripeCheckoutSessionId?: string;
    status?: string;
    booking?: BookingWithRelations;
  } = {},
) {
  const booking =
    overrides.booking ??
    makeBookingWithRelations({ id: overrides.bookingId ?? 'booking-1' });
  return {
    id: overrides.id ?? 'payment-1',
    quoteId: overrides.quoteId ?? 'quote-1',
    bookingId: overrides.bookingId ?? booking.id,
    stage: overrides.stage ?? 'FULL',
    expectedAmount: overrides.expectedAmount ?? 500,
    currency: overrides.currency ?? 'usd',
    stripeCheckoutSessionId:
      overrides.stripeCheckoutSessionId ?? 'cs_quote_open',
    status: overrides.status ?? 'PENDING',
    booking,
  };
}

/** Webhook payment row shape (`findWebhookPaymentBySessionId` include). */
export function makeWebhookPaymentRow(
  overrides: {
    id?: string;
    quoteId?: string;
    bookingId?: string;
    stage?: string;
    expectedAmount?: number;
    currency?: string;
    stripeCheckoutSessionId?: string;
    status?: string;
    customerEmailSentAt?: Date | null;
    booking?: BookingWithRelations;
    quote?: { id: string; totalAmount: number };
  } = {},
) {
  const booking =
    overrides.booking ??
    makeBookingWithRelations({ id: overrides.bookingId ?? 'booking-1' });
  return {
    id: overrides.id ?? 'payment-1',
    quoteId: overrides.quoteId ?? 'quote-1',
    bookingId: overrides.bookingId ?? booking.id,
    stage: overrides.stage ?? 'FULL',
    expectedAmount: overrides.expectedAmount ?? 500,
    currency: overrides.currency ?? 'usd',
    stripeCheckoutSessionId:
      overrides.stripeCheckoutSessionId ?? 'cs_booking_paid',
    status: overrides.status ?? 'PENDING',
    customerEmailSentAt: overrides.customerEmailSentAt ?? null,
    booking,
    quote: overrides.quote ?? {
      id: overrides.quoteId ?? 'quote-1',
      totalAmount: overrides.expectedAmount ?? 500,
    },
  };
}

export function makePaidCheckoutSession(
  overrides: {
    id?: string;
    amountCents?: number;
    currency?: string;
    paymentIntent?: string | { id?: string } | null;
    paymentStatus?: string;
  } = {},
) {
  const amount = overrides.amountCents ?? 50000;
  return {
    id: overrides.id ?? 'cs_booking_paid',
    metadata: { flow: 'booking_quote' },
    payment_status: overrides.paymentStatus ?? 'paid',
    amount_total: amount,
    amount_subtotal: amount,
    currency: overrides.currency ?? 'usd',
    payment_intent: overrides.paymentIntent ?? 'pi_booking_1',
  };
}

export function makeOccupiedPayload(
  date = '2026-07-15',
  occupied: Array<{ startMinutes: number; endMinutes: number }> = [
    { startMinutes: 600, endMinutes: 720 },
  ],
) {
  return { date, occupied };
}
