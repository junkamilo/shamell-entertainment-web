import type {
  AdminStripeWebhookEventRow,
  AdminStripeWebhookEventsListResponse,
} from "../../types/stripeWebhooks.types";
import {
  FIXTURE_CHECKOUT_SESSION_ID,
  FIXTURE_EVENT_ID,
  FIXTURE_WEBHOOK_ID,
  FIXTURE_WEBHOOK_ID_2,
} from "./uuids.fixture";

export function makeWebhookRow(
  overrides: Partial<AdminStripeWebhookEventRow> = {},
): AdminStripeWebhookEventRow {
  return {
    id: FIXTURE_WEBHOOK_ID,
    eventId: FIXTURE_EVENT_ID,
    eventType: "checkout.session.completed",
    livemode: false,
    status: "PROCESSED",
    metadataFlow: "class_session",
    checkoutSessionId: FIXTURE_CHECKOUT_SESSION_ID,
    handler: "classSessionCheckout",
    payloadSummary: { amount: 100 },
    processedAt: "2026-07-20T12:05:00.000Z",
    attempts: 1,
    lastError: null,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:05:00.000Z",
    ...overrides,
  };
}

export function makeWebhooksList(
  items: AdminStripeWebhookEventRow[] = [
    makeWebhookRow(),
    makeWebhookRow({
      id: FIXTURE_WEBHOOK_ID_2,
      eventId: "evt_test_fixture_2",
      status: "FAILED",
      metadataFlow: "venue_seat",
      handler: "venueSeatCheckout",
      attempts: 3,
      lastError: "Signature mismatch",
      checkoutSessionId: null,
      processedAt: null,
    }),
  ],
): AdminStripeWebhookEventsListResponse {
  return {
    items,
    meta: {
      page: 1,
      perPage: 20,
      totalItems: items.length,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
  };
}
