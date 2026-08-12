import { StripeWebhookProcessingStatus } from '@prisma/client';
import type { AdminStripeWebhookEventsQueryDto } from '../dto/admin-stripe-webhook-events-query.dto';
import type {
  AdminStripeWebhookEventDetail,
  AdminStripeWebhookEventRow,
  AdminStripeWebhookRelatedPayment,
} from '../types/admin-stripe-webhooks.types';
import type {
  BookingPaymentRelated,
  ClassEnrollmentRelated,
  RelatedPaymentSources,
  StripeWebhookEventPrismaRow,
  VenueReservationRelated,
} from '../utils/admin-stripe-webhooks-mapper.util';
import { emptyRelatedPaymentSources } from '../utils/admin-stripe-webhooks-mapper.util';

const NOW = new Date('2026-07-15T12:00:00.000Z');

export function makeListQuery(
  overrides: Partial<AdminStripeWebhookEventsQueryDto> = {},
): AdminStripeWebhookEventsQueryDto {
  return {
    page: 1,
    limit: 20,
    ...overrides,
  };
}

export function makePrismaWebhookEvent(
  overrides: Partial<StripeWebhookEventPrismaRow> = {},
): StripeWebhookEventPrismaRow {
  return {
    id: 'wh-row-1',
    eventId: 'evt_test_1',
    eventType: 'checkout.session.completed',
    livemode: false,
    status: StripeWebhookProcessingStatus.PROCESSED,
    metadataFlow: 'venue_seat',
    checkoutSessionId: 'cs_test_1',
    purchaseCorrelationId: 'corr-test-1',
    handler: 'venue',
    payloadSummary: { type: 'checkout.session.completed' },
    payload: null,
    processedAt: NOW,
    attempts: 1,
    lastError: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeWebhookEventRow(
  overrides: Partial<AdminStripeWebhookEventRow> = {},
): AdminStripeWebhookEventRow {
  return {
    id: 'wh-row-1',
    eventId: 'evt_test_1',
    eventType: 'checkout.session.completed',
    livemode: false,
    status: 'PROCESSED',
    metadataFlow: 'venue_seat',
    checkoutSessionId: 'cs_test_1',
    purchaseCorrelationId: 'corr-test-1',
    handler: 'venue',
    payloadSummary: { type: 'checkout.session.completed' },
    processedAt: NOW.toISOString(),
    attempts: 1,
    lastError: null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

export function makeRelatedPayment(
  overrides: Partial<AdminStripeWebhookRelatedPayment> = {},
): AdminStripeWebhookRelatedPayment {
  return {
    kind: 'venue_seat_reservation',
    id: 'vsr-1',
    status: 'PAID',
    customerEmail: 'guest@example.com',
    amount: '100',
    currency: 'usd',
    paidAt: NOW.toISOString(),
    ...overrides,
  };
}

export function makeWebhookEventDetail(
  overrides: Partial<AdminStripeWebhookEventDetail> = {},
): AdminStripeWebhookEventDetail {
  return {
    ...makeWebhookEventRow(),
    payload: null,
    relatedPayments: [makeRelatedPayment()],
    ...overrides,
  };
}

export function makeBookingPaymentRelated(
  overrides: Partial<BookingPaymentRelated> = {},
): BookingPaymentRelated {
  return {
    id: 'bp-1',
    status: 'PAID',
    expectedAmount: 150 as never,
    currency: 'usd',
    paidAt: NOW,
    booking: { user: { email: 'ada@example.com' } },
    ...overrides,
  };
}

export function makeClassEnrollmentRelated(
  overrides: Partial<ClassEnrollmentRelated> = {},
): ClassEnrollmentRelated {
  return {
    id: 'uce-1',
    status: 'PAID',
    amount: 75 as never,
    currency: 'usd',
    paidAt: NOW,
    customerEmail: 'marie@example.com',
    ...overrides,
  };
}

export function makeVenueReservationRelated(
  overrides: Partial<VenueReservationRelated> = {},
): VenueReservationRelated {
  return {
    id: 'vsr-1',
    status: 'PAID',
    amount: 200 as never,
    currency: 'usd',
    paidAt: NOW,
    customerEmail: 'grace@example.com',
    ...overrides,
  };
}

export function makeRelatedSources(
  overrides: Partial<RelatedPaymentSources> = {},
): RelatedPaymentSources {
  return {
    ...emptyRelatedPaymentSources(),
    ...overrides,
  };
}
