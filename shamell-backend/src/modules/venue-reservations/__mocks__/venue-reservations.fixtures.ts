import { VenueSeatKind, VenueSeatReservationStatus } from '@prisma/client';

export function makeVenueSeatReservationLite(
  overrides: Partial<{
    id: string;
    status: VenueSeatReservationStatus;
    kind: VenueSeatKind;
    stripeCheckoutSessionId: string | null;
    payTokenHash: string | null;
    upcomingEventId: string;
    layoutItemId: string;
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
    ...overrides,
  };
}

export function makeCheckoutSessionStub(
  overrides: Partial<{
    id: string;
    metadata: Record<string, string>;
    payment_status: string;
  }> = {},
) {
  return {
    id: 'cs_test_1',
    metadata: { flow: 'venue_seat' },
    payment_status: 'unpaid',
    ...overrides,
  };
}
