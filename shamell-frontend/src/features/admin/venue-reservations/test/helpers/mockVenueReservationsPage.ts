import { vi } from "vitest";
import {
  makeVenueReservationsMeta,
  makeVenueSeatReservation,
} from "../fixtures/venueReservations.fixture";
import { FIXTURE_RESERVATION_ID_2 } from "../fixtures/uuids.fixture";

export function createMockVenueReservationsPageState(
  overrides: Record<string, unknown> = {},
) {
  const reservations = [
    makeVenueSeatReservation(),
    makeVenueSeatReservation({
      id: FIXTURE_RESERVATION_ID_2,
      kind: "standalone_chair",
      tableName: null,
      tableSize: null,
      status: "PENDING_PAYMENT",
      paymentChannel: "CASH",
      customerName: "Grace Hopper",
      customerEmail: "grace@example.com",
      paidAt: null,
      amount: 35,
    }),
  ];

  return {
    reservations,
    paginationMeta: makeVenueReservationsMeta({
      totalItems: reservations.length,
    }),
    statusFilter: "",
    setStatusFilter: vi.fn(),
    paymentChannelFilter: "",
    setPaymentChannelFilter: vi.fn(),
    layoutItemIdFilter: "",
    setLayoutItemIdFilter: vi.fn(),
    isLoading: false,
    cancellingId: null as string | null,
    cancelReservation: vi.fn(async () => undefined),
    reload: vi.fn(async () => undefined),
    onPageChange: vi.fn(),
    onPerPageChange: vi.fn(),
    ...overrides,
  };
}
