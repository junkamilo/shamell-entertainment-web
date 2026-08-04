import { vi } from "vitest";
import {
  makeClassSession,
  makeFloorLayoutApiPayload,
  makeOnComingEventDetail,
  makeRecurringSchedule,
  makeStandaloneChairsApiPayload,
  makeVenueTableApiRow,
} from "../fixtures/onComingEvents.fixture";
import { FIXTURE_EVENT_SLUG } from "../fixtures/uuids.fixture";
import { parseScheduleViewModel } from "../../lib/parseScheduleViewModel";

export function createMockEventDetailProps(
  overrides: Record<string, unknown> = {},
) {
  return {
    slug: FIXTURE_EVENT_SLUG,
    detail: makeOnComingEventDetail(),
    ...overrides,
  };
}

export function createMockClassBookingWizardProps(
  overrides: Record<string, unknown> = {},
) {
  return {
    slug: FIXTURE_EVENT_SLUG,
    sessions: [makeClassSession()],
    schedule: makeRecurringSchedule(),
    open: true,
    onClose: vi.fn(),
    ...overrides,
  };
}

export function createScheduleViewModel() {
  const model = parseScheduleViewModel(makeRecurringSchedule());
  if (!model) {
    throw new Error("Expected recurring schedule fixture to parse");
  }
  return model;
}

export function createVenueLayoutItemModalProps(
  overrides: Record<string, unknown> = {},
) {
  const layout = makeFloorLayoutApiPayload();
  const item = layout.items[0]!;
  return {
    item,
    tableConfig: makeVenueTableApiRow(),
    standaloneChairs: makeStandaloneChairsApiPayload(),
    chairPricesById: new Map<string, number>(),
    eventLabel: "Saturday Gala",
    eventDateIso: "2030-08-01",
    isReserved: false,
    reservationsOpen: true,
    onClose: vi.fn(),
    ...overrides,
  };
}

export function createStickyPurchaseBarProps(
  overrides: Record<string, unknown> = {},
) {
  return {
    slug: FIXTURE_EVENT_SLUG,
    purchaseMode: "classes" as const,
    purchasable: true,
    salesOpen: true,
    hasActiveSessions: true,
    showMonthPackage: true,
    monthPackageLabel: "August package",
    onBuyMonthPackage: vi.fn(),
    onBuyTicket: vi.fn(),
    ...overrides,
  };
}
