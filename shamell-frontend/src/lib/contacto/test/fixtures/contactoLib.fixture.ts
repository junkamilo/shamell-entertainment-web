import type {
  PublicAvailabilityRules,
  PublicClosure,
  PublicWeeklySlot,
} from "../../bookingAvailability";
import { CONTACTO_PATH } from "../../contactInquiryConstants";
import { FIXTURE_BOOKING_TZ, FIXTURE_INQUIRY_CODE } from "./uuids.fixture";

export function makeWeeklySlot(
  overrides: Partial<PublicWeeklySlot> = {},
): PublicWeeklySlot {
  return {
    weekday: 1,
    isClosed: false,
    startTime: "10:00",
    endTime: "18:00",
    ...overrides,
  };
}

export function makeClosure(
  overrides: Partial<PublicClosure> = {},
): PublicClosure {
  return {
    kind: "SPECIFIC_DATE",
    date: "2030-01-15",
    weekday: null,
    startDate: null,
    endDate: null,
    note: "Holiday",
    ...overrides,
  };
}

export function makePublicAvailabilityRules(
  overrides: Partial<PublicAvailabilityRules> = {},
): PublicAvailabilityRules {
  const weekly: PublicWeeklySlot[] = Array.from({ length: 7 }, (_, weekday) =>
    makeWeeklySlot({
      weekday,
      isClosed: weekday === 0,
      startTime: weekday === 0 ? null : "10:00",
      endTime: weekday === 0 ? null : "18:00",
    }),
  );
  return {
    timeZone: FIXTURE_BOOKING_TZ,
    weekly,
    closures: [makeClosure()],
    ...overrides,
  };
}

export function makeInquiryDeepLinkCases() {
  return {
    code: FIXTURE_INQUIRY_CODE,
    serviceHref: `${CONTACTO_PATH}?serviceType=${FIXTURE_INQUIRY_CODE}&entry=home_service_card`,
  } as const;
}
