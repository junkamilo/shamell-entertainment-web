import type { AdminVenueConfig } from "../../services/patchAdminVenueConfig";
import type { VenueLayoutClientSettings } from "../../types/venueLayoutPromo.types";
import type {
  FloorLayoutPalette,
  PlacedLayoutItem,
  VenueFloorLayout,
} from "../../layout/types/floorLayout.types";
import type { ReservationEventTemplate } from "../../reservation-events/types/reservationEventTemplate.types";
import {
  FIXTURE_CHAIR_CONFIG_ID,
  FIXTURE_EVENT_ID,
  FIXTURE_LAYOUT_CHAIR_ID,
  FIXTURE_LAYOUT_ID,
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_SECTION_ID,
  FIXTURE_SETTINGS_ID,
  FIXTURE_TABLE_CONFIG_ID,
  FIXTURE_TEMPLATE_ID,
  FIXTURE_TEMPLATE_ID_2,
  FIXTURE_VENUE_CONFIG_ID,
} from "./uuids.fixture";

export function makeVenueLayoutSettings(
  overrides: Partial<VenueLayoutClientSettings> = {},
): VenueLayoutClientSettings {
  return {
    id: FIXTURE_SETTINGS_ID,
    clientEnabled: true,
    promoTitle: "On Coming Events",
    promoDescription: "Reserve seats for our next night.",
    promoImageUrl: "https://cdn.example.com/promo.jpg",
    reservationEventDate: "2030-08-01T20:00:00.000Z",
    reservationOpensAt: "2030-07-01T12:00:00.000Z",
    reservationClosesAt: "2030-07-31T23:59:00.000Z",
    reservationEventLabel: "Saturday Gala",
    reservationTimezone: "America/New_York",
    updatedAt: "2026-07-20T12:00:00.000Z",
    promoImagePublicId: "promo/public-id",
    createdAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

export function makeSettingsApiPayload(
  settings: VenueLayoutClientSettings = makeVenueLayoutSettings(),
) {
  return { settings };
}

export function makeReservationEventTemplate(
  overrides: Partial<ReservationEventTemplate> = {},
): ReservationEventTemplate {
  return {
    id: FIXTURE_TEMPLATE_ID,
    name: "Saturday Gala",
    timezone: "America/New_York",
    scheduleMode: "FIXED_EVENT",
    salesStartDate: "2030-07-01",
    salesEndDate: "2030-07-31",
    eventDate: "2030-08-01",
    eventStartTime: "20:00",
    eventEndTime: "23:00",
    recurringEffectiveFrom: null,
    recurringStartTime: null,
    recurringEndTime: null,
    startDate: "2030-08-01",
    endDate: "2030-08-01",
    startTime: "20:00",
    endTime: "23:00",
    weekdays: [],
    classSections: [],
    activeDayLabels: [],
    summary: "Fri Aug 1 · 8:00 PM–11:00 PM",
    linkedEventIds: [],
    updatedAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

export function makeRecurringReservationEventTemplate(
  overrides: Partial<ReservationEventTemplate> = {},
): ReservationEventTemplate {
  return makeReservationEventTemplate({
    id: FIXTURE_TEMPLATE_ID_2,
    name: "Weekly Bachata",
    scheduleMode: "RECURRING_WEEKLY",
    salesStartDate: null,
    salesEndDate: null,
    eventDate: null,
    eventStartTime: null,
    eventEndTime: null,
    recurringEffectiveFrom: "2030-07-01",
    recurringStartTime: "19:00",
    recurringEndTime: "21:00",
    startDate: null,
    endDate: null,
    startTime: "19:00",
    endTime: "21:00",
    weekdays: [
      { weekday: 1, isActive: true },
      { weekday: 3, isActive: true },
    ],
    classSections: [
      {
        id: FIXTURE_SECTION_ID,
        weekday: 1,
        label: "Beginner",
        startTime: "19:00",
        endTime: "20:00",
        sortOrder: 0,
        defaultCapacity: 20,
        defaultPrice: 25,
        isActive: true,
      },
    ],
    activeDayLabels: ["Mon", "Wed"],
    summary: "Mon & Wed · 7:00 PM–9:00 PM",
    ...overrides,
  });
}

export function makeAdminVenueConfig(
  overrides: Partial<AdminVenueConfig> = {},
): AdminVenueConfig {
  return {
    id: FIXTURE_VENUE_CONFIG_ID,
    eventId: FIXTURE_EVENT_ID,
    clientEnabled: true,
    fixedTicketCapacity: null,
    classPackageEnabled: false,
    classPackagePrice: null,
    classPackageLabel: null,
    reservationEventTemplateId: FIXTURE_TEMPLATE_ID,
    reservationEventLabel: "Saturday Gala",
    reservationOpensAt: "2030-07-01T12:00:00.000Z",
    reservationClosesAt: "2030-07-31T23:59:00.000Z",
    reservationEventTemplate: makeReservationEventTemplate(),
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
    tableName: "Large 1",
    size: "LARGE",
    includedChairs: 8,
    x: 100,
    y: 200,
    rotation: 0,
    ...overrides,
  };
}

export function makeStandaloneChairItem(
  overrides: Partial<Extract<PlacedLayoutItem, { kind: "standalone_chair" }>> = {},
): Extract<PlacedLayoutItem, { kind: "standalone_chair" }> {
  return {
    id: FIXTURE_LAYOUT_CHAIR_ID,
    kind: "standalone_chair",
    venueStandaloneChairId: FIXTURE_CHAIR_CONFIG_ID,
    chairName: "Chair 1",
    unitPrice: 35,
    x: 150,
    y: 250,
    rotation: 45,
    ...overrides,
  };
}

export function makeFloorLayout(
  overrides: Partial<VenueFloorLayout> = {},
): VenueFloorLayout {
  return {
    id: FIXTURE_LAYOUT_ID,
    viewBoxWidth: 614,
    viewBoxHeight: 944,
    backgroundVersion: "v1",
    items: [makeCatalogTableItem(), makeStandaloneChairItem()],
    sceneZones: {
      stage: { x: 0, z: -8, rotationY: 0 },
      carpet: { x: 0, z: 2, rotationY: 0 },
    },
    totalChairs: 9,
    updatedAt: "2026-07-20T12:00:00.000Z",
    isDefault: false,
    hasLegacyItems: false,
    ...overrides,
  };
}

export function makeFloorLayoutApiPayload(
  layout: VenueFloorLayout = makeFloorLayout(),
) {
  return {
    id: layout.id,
    viewBoxWidth: layout.viewBoxWidth,
    viewBoxHeight: layout.viewBoxHeight,
    backgroundVersion: layout.backgroundVersion,
    items: layout.items,
    sceneZones: layout.sceneZones,
    totalChairs: layout.totalChairs,
    updatedAt: layout.updatedAt,
    isDefault: layout.isDefault,
    hasLegacyItems: layout.hasLegacyItems,
  };
}

export function makeFloorLayoutPalette(
  overrides: Partial<FloorLayoutPalette> = {},
): FloorLayoutPalette {
  return {
    tablesBySize: { LARGE: 2, MEDIUM: 1, SMALL: 0 },
    standaloneChairsAvailable: 5,
    unplacedTables: [
      {
        id: FIXTURE_TABLE_CONFIG_ID,
        tableName: "Large 2",
        size: "LARGE",
        includedChairs: 8,
        sortOrder: 0,
      },
    ],
    unplacedChairs: [
      {
        id: FIXTURE_CHAIR_CONFIG_ID,
        chairName: "Chair 2",
        displayLabel: "Chair 2",
        unitPrice: 35,
        sortOrder: 0,
      },
    ],
    placedTableIds: [FIXTURE_TABLE_CONFIG_ID],
    placedChairIds: [FIXTURE_CHAIR_CONFIG_ID],
    placedChairCount: 1,
    ...overrides,
  };
}

export function makeVenueAvailability(overrides: Record<string, unknown> = {}) {
  return {
    upcomingEventId: FIXTURE_EVENT_ID,
    upcomingEventSlug: "gala-night",
    eventDate: "2030-08-01",
    reservedLayoutItemIds: [FIXTURE_LAYOUT_ITEM_ID],
    reservedVenueTableConfigIds: [FIXTURE_TABLE_CONFIG_ID],
    reservedSeatShortLabels: ["Large 1"],
    pendingLayoutItemIds: [] as string[],
    paidSeatHolders: [
      { layoutItemId: FIXTURE_LAYOUT_ITEM_ID, customerName: "Ada Lovelace" },
    ],
    ...overrides,
  };
}
