import type { DaySectionOffer } from "@/features/on-coming-events/lib/buildDaySectionOffers";
import {
  makeBookClassEventContext,
  makeClassSessionPublic,
  makeMonthPackageOffer,
  makeRecurringSchedule,
} from "@/features/admin/agenda/book-class/test/fixtures/bookClass.fixture";
import type {
  BoxOfficeClassEventContext,
  BoxOfficeClassEventOption,
  BoxOfficeClassesDetailsPayload,
  CreateBoxOfficeClassEnrollmentBody,
} from "../../types/boxOfficeClasses.types";
import type {
  BoxOfficeDetailsPayload,
  BoxOfficeFixedEvent,
  BoxOfficeSeatOption,
} from "../../types/boxOfficeFixed.types";
import {
  FIXTURE_CLASS_EVENT_ID,
  FIXTURE_ENROLLMENT_ID,
  FIXTURE_FIXED_EVENT_ID,
  FIXTURE_LAYOUT_CHAIR_ID,
  FIXTURE_LAYOUT_TABLE_ID,
  FIXTURE_SECTION_ID,
  FIXTURE_SESSION_ID,
  FIXTURE_VENUE_EVENT_ID,
  FIXTURE_VENUE_TABLE_CONFIG_ID,
} from "./uuids.fixture";

export function makeVenueFixedEvent(
  overrides: Partial<BoxOfficeFixedEvent> = {},
): BoxOfficeFixedEvent {
  return {
    id: FIXTURE_VENUE_EVENT_ID,
    name: "Gala Night",
    slug: "gala-night",
    purchaseKind: "venue_seating",
    price: null,
    currency: "usd",
    ticketsRemaining: null,
    fixedTicketCapacity: null,
    floorLayoutId: "fl_1",
    eventDateIso: "2030-08-01",
    eventLabel: "Saturday Gala",
    ...overrides,
  };
}

export function makeFixedTicketEvent(
  overrides: Partial<BoxOfficeFixedEvent> = {},
): BoxOfficeFixedEvent {
  return {
    id: FIXTURE_FIXED_EVENT_ID,
    name: "Showcase",
    slug: "showcase",
    purchaseKind: "fixed_ticket",
    price: 45,
    currency: "usd",
    ticketsRemaining: 12,
    fixedTicketCapacity: 100,
    floorLayoutId: null,
    eventDateIso: "2030-08-15",
    eventLabel: null,
    ...overrides,
  };
}

export function makeTableSeat(
  overrides: Partial<BoxOfficeSeatOption> = {},
): BoxOfficeSeatOption {
  return {
    layoutItemId: FIXTURE_LAYOUT_TABLE_ID,
    kind: "catalog_table",
    tableSize: "LARGE",
    venueTableConfigId: FIXTURE_VENUE_TABLE_CONFIG_ID,
    seatLabel: "Large 1",
    fullLabel: "Large table 1",
    detail: "8 chairs",
    amount: 250,
    reserved: false,
    pending: false,
    ...overrides,
  };
}

export function makeChairSeat(
  overrides: Partial<BoxOfficeSeatOption> = {},
): BoxOfficeSeatOption {
  return {
    layoutItemId: FIXTURE_LAYOUT_CHAIR_ID,
    kind: "standalone_chair",
    seatLabel: "Chair 12",
    fullLabel: "Chair 12",
    detail: "Standalone chair",
    amount: 35,
    reserved: false,
    pending: false,
    ...overrides,
  };
}

export function makeSeatAvailability(overrides: Record<string, unknown> = {}) {
  return {
    upcomingEventId: FIXTURE_VENUE_EVENT_ID,
    upcomingEventSlug: "gala-night",
    eventDate: "2030-08-01",
    reservedLayoutItemIds: [] as string[],
    reservedVenueTableConfigIds: [] as string[],
    reservedSeatShortLabels: [] as string[],
    pendingLayoutItemIds: [] as string[],
    paidSeatHolders: [] as Array<{ layoutItemId: string; customerName: string }>,
    ...overrides,
  };
}

export function makeBoxOfficeClassEventOption(
  overrides: Partial<BoxOfficeClassEventOption> = {},
): BoxOfficeClassEventOption {
  return {
    id: FIXTURE_CLASS_EVENT_ID,
    name: "Salsa Series",
    slug: "salsa-series",
    ...overrides,
  };
}

export function makeBoxOfficeClassContext(
  overrides: Partial<BoxOfficeClassEventContext> = {},
): BoxOfficeClassEventContext {
  const base = makeBookClassEventContext({
    event: {
      id: FIXTURE_CLASS_EVENT_ID,
      slug: "salsa-series",
      name: "Salsa Series",
      timezone: "America/New_York",
    },
    schedule: makeRecurringSchedule(),
    sessions: [
      makeClassSessionPublic({
        id: FIXTURE_SESSION_ID,
        sectionId: FIXTURE_SECTION_ID,
      }),
    ],
    monthPackage: makeMonthPackageOffer({ currentMonthIso: "2030-03" }),
  });
  return { ...base, ...overrides };
}

export function makeDaySectionOffer(
  overrides: Partial<DaySectionOffer> = {},
): DaySectionOffer {
  return {
    sectionId: FIXTURE_SECTION_ID,
    label: "Beginner",
    startTime: "18:00",
    endTime: "19:00",
    sortOrder: 0,
    sessionId: FIXTURE_SESSION_ID,
    price: 30,
    capacity: 20,
    seatsSold: 5,
    seatsRemaining: 15,
    available: true,
    ...overrides,
  };
}

export function makeFixedDetails(
  overrides: Partial<BoxOfficeDetailsPayload> = {},
): BoxOfficeDetailsPayload {
  return {
    source: "box_office",
    mode: "fixed",
    purchaseKind: "fixed_ticket",
    upcomingEventId: FIXTURE_FIXED_EVENT_ID,
    paymentMethod: "cash",
    customer: {
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: null,
    },
    selection: { quantity: 1, amount: 45, currency: "usd" },
    submittedAt: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeClassesDetails(
  overrides: Partial<BoxOfficeClassesDetailsPayload> = {},
): BoxOfficeClassesDetailsPayload {
  return {
    source: "box_office",
    mode: "classes",
    purchaseKind: "session",
    upcomingEventId: FIXTURE_CLASS_EVENT_ID,
    paymentMethod: "cash",
    customer: {
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: null,
    },
    selection: {
      kind: "session",
      sessionId: FIXTURE_SESSION_ID,
      amount: 30,
      currency: "usd",
    },
    submittedAt: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeClassEnrollmentBody(
  overrides: Partial<CreateBoxOfficeClassEnrollmentBody> = {},
): CreateBoxOfficeClassEnrollmentBody {
  return {
    purchaseKind: "session",
    upcomingEventId: FIXTURE_CLASS_EVENT_ID,
    sessionId: FIXTURE_SESSION_ID,
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    boxOfficeDetails: makeClassesDetails(),
    ...overrides,
  };
}

export { FIXTURE_ENROLLMENT_ID };
