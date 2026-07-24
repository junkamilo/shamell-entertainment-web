import type { PaginationMeta } from "@/lib/pagination";
import type { VenueSeatReservationRow } from "../../types/venueReservations.types";
import {
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_RESERVATION_ID,
  FIXTURE_RESERVATION_ID_2,
  FIXTURE_TABLE_CONFIG_ID,
} from "./uuids.fixture";

export function makeVenueSeatReservation(
  overrides: Partial<VenueSeatReservationRow> = {},
): VenueSeatReservationRow {
  return {
    id: FIXTURE_RESERVATION_ID,
    kind: "catalog_table",
    layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
    venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
    tableName: "Large 1",
    tableSize: "LARGE",
    eventDate: "2030-08-01",
    amount: 250,
    currency: "usd",
    status: "PAID",
    paymentChannel: "STRIPE",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    customerPhone: "+15551234567",
    stripeCheckoutSessionId: "cs_test_1",
    paidAt: "2026-07-20T12:00:00.000Z",
    createdAt: "2026-07-20T11:00:00.000Z",
    ...overrides,
  };
}

export function makeVenueReservationsMeta(
  overrides: Partial<PaginationMeta> = {},
): PaginationMeta {
  return {
    page: 1,
    perPage: 10,
    totalItems: 2,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
    ...overrides,
  };
}

export function makeVenueReservationsApiPayload(
  reservations: VenueSeatReservationRow[] = [
    makeVenueSeatReservation(),
    makeVenueSeatReservation({
      id: FIXTURE_RESERVATION_ID_2,
      kind: "standalone_chair",
      tableName: null,
      tableSize: null,
      venueTableConfigId: null,
      status: "PENDING_PAYMENT",
      paymentChannel: "CASH",
      customerName: "Grace Hopper",
      customerEmail: "grace@example.com",
      paidAt: null,
      amount: 35,
    }),
  ],
  meta: PaginationMeta = makeVenueReservationsMeta({
    totalItems: reservations.length,
  }),
) {
  return { reservations, meta };
}
