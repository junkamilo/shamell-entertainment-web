import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import type { OnComingEventsPromo } from "../../onComingSettings";
import type {
  ChairCatalogRow,
  TableCatalogRow,
} from "../../venueSeatDisplayLabel";
import {
  FIXTURE_CHAIR_ID,
  FIXTURE_CHAIR_ID_2,
  FIXTURE_EVENT_ID,
  FIXTURE_EVENT_SLUG,
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_LAYOUT_ITEM_ID_2,
  FIXTURE_TABLE_CONFIG_ID,
  FIXTURE_TABLE_CONFIG_ID_2,
} from "./uuids.fixture";

export function makeOnComingPromo(
  overrides: Partial<OnComingEventsPromo> = {},
): OnComingEventsPromo {
  return {
    clientEnabled: true,
    promoTitle: "On Coming Promo",
    promoDescription: "Promo copy",
    promoImageUrl: "https://cdn.example.com/oce/promo.jpg",
    reservationEventDate: "2030-08-01",
    reservationOpensAt: null,
    reservationClosesAt: null,
    reservationEventLabel: "Gala Night",
    reservationTimezone: "America/New_York",
    updatedAt: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeUpcomingEventApiItem(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: FIXTURE_EVENT_ID,
    eventTypeName: "Gala Night",
    description: "An elegant upcoming gala with full staging and dance.",
    items: ["Dance set", "Host"],
    slug: FIXTURE_EVENT_SLUG,
    experienceType: "VENUE_SEATING",
    purchaseMode: "venue_seating",
    purchasable: true,
    heroImageUrl: "https://cdn.example.com/oce/event.jpg",
    heroMediaType: "IMAGE",
    images: ["https://cdn.example.com/oce/event.jpg"],
    fixedTicketCapacity: 100,
    ticketsSold: 10,
    ticketsRemaining: 90,
    eventStartsAt: "2030-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeCatalogTableItem(
  overrides: Partial<Extract<PlacedLayoutItem, { kind: "catalog_table" }>> = {},
): Extract<PlacedLayoutItem, { kind: "catalog_table" }> {
  return {
    id: FIXTURE_LAYOUT_ITEM_ID,
    kind: "catalog_table",
    venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
    tableName: "LARGE-aaaaaaaa",
    size: "LARGE",
    includedChairs: 8,
    x: 10,
    y: 20,
    rotation: 0,
    ...overrides,
  };
}

export function makeStandaloneChairItem(
  overrides: Partial<
    Extract<PlacedLayoutItem, { kind: "standalone_chair" }>
  > = {},
): Extract<PlacedLayoutItem, { kind: "standalone_chair" }> {
  return {
    id: FIXTURE_LAYOUT_ITEM_ID_2,
    kind: "standalone_chair",
    venueStandaloneChairId: FIXTURE_CHAIR_ID,
    chairName: "Chair",
    x: 5,
    y: 5,
    rotation: 0,
    ...overrides,
  };
}

export function makeTableCatalogRow(
  overrides: Partial<TableCatalogRow> = {},
): TableCatalogRow {
  return {
    id: FIXTURE_TABLE_CONFIG_ID,
    tableName: "LARGE-aaaaaaaa",
    size: "LARGE",
    sortOrder: 0,
    isActive: true,
    ...overrides,
  };
}

export function makeChairCatalogRow(
  overrides: Partial<ChairCatalogRow> = {},
): ChairCatalogRow {
  return {
    id: FIXTURE_CHAIR_ID,
    chairName: "Chair",
    sortOrder: 0,
    isActive: true,
    ...overrides,
  };
}

export function makeTableCatalogPeers() {
  return [
    makeTableCatalogRow(),
    makeTableCatalogRow({
      id: FIXTURE_TABLE_CONFIG_ID_2,
      tableName: "LARGE-bbbbbbbb",
      sortOrder: 1,
    }),
  ];
}

export function makeChairCatalogPeers() {
  return [
    makeChairCatalogRow(),
    makeChairCatalogRow({
      id: FIXTURE_CHAIR_ID_2,
      chairName: "Chair",
      sortOrder: 1,
    }),
  ];
}
