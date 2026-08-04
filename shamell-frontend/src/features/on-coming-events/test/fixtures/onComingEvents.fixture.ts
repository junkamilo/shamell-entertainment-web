import type { OnComingEventsPromo } from "@/hooks/use-on-coming-events-settings";
import type {
  ClassSessionPublic,
} from "../../services/fetchUpcomingClassSessions";
import type {
  MonthPackageOffer,
  OnComingEventDetail,
  OnComingEventSchedule,
} from "../../services/fetchOnComingEventDetail";
import type {
  VenueReservationAvailability,
} from "../../services/fetchVenueReservationAvailability";
import type { VenueSessionStatus } from "../../services/fetchVenueSessionStatus";
import {
  FIXTURE_EVENT_ID,
  FIXTURE_EVENT_SLUG,
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_PACKAGE_ENROLLMENT_ID,
  FIXTURE_RESERVATION_ID,
  FIXTURE_SECTION_ID,
  FIXTURE_SESSION_ID,
  FIXTURE_TABLE_CONFIG_ID,
} from "./uuids.fixture";

export function makeClassSession(
  overrides: Partial<ClassSessionPublic> = {},
): ClassSessionPublic {
  return {
    id: FIXTURE_SESSION_ID,
    startsAt: "2030-08-04T23:00:00.000Z",
    endsAt: "2030-08-05T00:00:00.000Z",
    timezone: "America/New_York",
    capacity: 20,
    price: 25,
    currency: "usd",
    seatsRemaining: 12,
    weekday: 1,
    sectionId: FIXTURE_SECTION_ID,
    sectionLabel: "Beginner",
    sectionStartTime: "19:00",
    sectionEndTime: "20:00",
    ...overrides,
  };
}

export function makeRecurringSchedule(
  overrides: Partial<Extract<OnComingEventSchedule, { mode: "RECURRING_WEEKLY" }>> = {},
): Extract<OnComingEventSchedule, { mode: "RECURRING_WEEKLY" }> {
  return {
    mode: "RECURRING_WEEKLY",
    timezone: "America/New_York",
    summary: "Mon · 7:00 PM–8:00 PM",
    effectiveFrom: "2030-07-01",
    weekdayLabels: ["Mon"],
    startTime: "19:00",
    endTime: "20:00",
    days: [
      {
        weekday: 1,
        label: "Monday",
        sections: [
          {
            id: FIXTURE_SECTION_ID,
            label: "Beginner",
            startTime: "19:00",
            endTime: "20:00",
            sortOrder: 0,
          },
        ],
      },
    ],
    ...overrides,
  };
}

export function makeMonthPackage(
  overrides: Partial<MonthPackageOffer> = {},
): MonthPackageOffer {
  return {
    enabled: true,
    price: 120,
    label: "August package",
    currentMonthIso: "2030-08",
    currentMonthSessionCount: 4,
    purchasable: true,
    purchasableMonths: ["2030-08", "2030-09"],
    ...overrides,
  };
}

export function makeOnComingEventDetail(
  overrides: Partial<OnComingEventDetail> = {},
): OnComingEventDetail {
  return {
    id: FIXTURE_EVENT_ID,
    slug: FIXTURE_EVENT_SLUG,
    eventTypeName: "Weekly Bachata",
    description: "Beginner-friendly weekly class.",
    items: ["Floor practice", "Partner work"],
    price: 25,
    experienceType: "CLASSES",
    classVariant: null,
    heroImageUrl: "https://cdn.example.com/class.jpg",
    heroMediaType: "IMAGE",
    schedule: makeRecurringSchedule(),
    hasActiveSessions: true,
    salesOpen: true,
    purchasable: true,
    purchaseMode: "classes",
    sessions: [makeClassSession()],
    monthPackage: makeMonthPackage(),
    ...overrides,
  };
}

export function makeHubEvent(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: FIXTURE_EVENT_ID,
    slug: FIXTURE_EVENT_SLUG,
    eventTypeName: "Weekly Bachata",
    description: "Weekly bachata social and class night.",
    items: ["Class", "Social"],
    heroImageUrl: "https://cdn.example.com/class.jpg",
    heroMediaType: "IMAGE",
    experienceType: "CLASSES",
    purchaseMode: "classes",
    purchasable: true,
    ...overrides,
  };
}

export function makeOnComingEventsPromo(
  overrides: Partial<OnComingEventsPromo> = {},
): OnComingEventsPromo {
  return {
    clientEnabled: true,
    promoTitle: "On Coming Events",
    promoDescription: "Reserve your seat.",
    promoImageUrl: "https://cdn.example.com/promo.jpg",
    reservationEventDate: "2030-08-01T20:00:00.000Z",
    reservationOpensAt: "2030-07-01T12:00:00.000Z",
    reservationClosesAt: "2030-07-31T23:59:00.000Z",
    reservationEventLabel: "Saturday Gala",
    reservationTimezone: "America/New_York",
    updatedAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

export function makeVenueAvailability(
  overrides: Partial<VenueReservationAvailability> = {},
): VenueReservationAvailability {
  return {
    eventDate: "2030-08-01",
    reservationOpensAt: "2030-07-01T12:00:00.000Z",
    reservationClosesAt: "2030-07-31T23:59:00.000Z",
    reservationsOpen: true,
    salesClosedReason: null,
    reservedLayoutItemIds: [],
    reservedVenueTableConfigIds: [],
    reservedSeatShortLabels: [],
    paidSeatHolders: [],
    ...overrides,
  };
}

export function makeFloorLayoutApiPayload() {
  return {
    id: "fl-1",
    viewBoxWidth: 614,
    viewBoxHeight: 944,
    backgroundVersion: "v1",
    items: [
      {
        id: FIXTURE_LAYOUT_ITEM_ID,
        kind: "catalog_table",
        venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
        tableName: "Large 1",
        size: "LARGE",
        includedChairs: 8,
        x: 100,
        y: 200,
        rotation: 0,
      },
    ],
    sceneZones: {
      stage: { x: 0, z: -8, rotationY: 0 },
      carpet: { x: 0, z: 2, rotationY: 0 },
    },
    totalChairs: 8,
    updatedAt: "2026-07-20T12:00:00.000Z",
  };
}

export function makeVenueTableApiRow() {
  return {
    id: FIXTURE_TABLE_CONFIG_ID,
    tableName: "Large 1",
    displayLabel: "Large 1",
    size: "LARGE",
    includedChairs: 8,
    bundlePrice: 250,
    visualCoordinates: null,
    isActive: true,
    sortOrder: 0,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
  };
}

export function makeStandaloneChairsApiPayload() {
  return {
    id: "sc-config-1",
    availableQuantity: 5,
    unitPrice: 35,
    updatedAt: "2026-07-20T12:00:00.000Z",
    isDefault: false,
    reservedCount: 0,
    totalCount: 5,
    chairs: [],
  };
}

export function makeCheckoutSuccess(
  overrides: Record<string, unknown> = {},
) {
  return {
    clientSecret: "cs_test_secret_fixture",
    reservationId: FIXTURE_RESERVATION_ID,
    packageEnrollmentId: FIXTURE_PACKAGE_ENROLLMENT_ID,
    ...overrides,
  };
}

export function makeVenueSessionStatus(
  overrides: Partial<VenueSessionStatus> = {},
): VenueSessionStatus {
  return {
    stripeStatus: "complete",
    reservation: {
      id: FIXTURE_RESERVATION_ID,
      kind: "catalog_table",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      tableName: "Large 1",
      seatDisplayLabel: "Large 1",
      status: "PAID",
      amount: 250,
      currency: "usd",
      customerName: "Ada Lovelace",
      customerEmail: "ada@example.com",
      eventDate: "2030-08-01",
      paidAt: "2026-07-20T12:00:00.000Z",
    },
    ...overrides,
  };
}

export function makeSessionsPayload(
  sessions: ClassSessionPublic[] = [makeClassSession()],
) {
  return {
    event: {
      eventTypeName: "Weekly Bachata",
      slug: FIXTURE_EVENT_SLUG,
      description: "Beginner-friendly weekly class.",
    },
    sessions,
  };
}
