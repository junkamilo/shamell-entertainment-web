import type { ClassSessionPublic } from "@/features/on-coming-events/services/fetchUpcomingClassSessions";
import type {
  MonthPackageOffer,
  OnComingEventSchedule,
} from "@/features/on-coming-events/services/fetchOnComingEventDetail";
import type { BookClassFormSnapshot } from "../../lib/bookClassValidation";
import type {
  BookClassEventContext,
  BookClassEventOption,
  CreateAdminClassEnrollmentBody,
} from "../../types/bookClass.types";
import {
  FIXTURE_CLASS_EVENT_ID,
  FIXTURE_ENROLLMENT_ID,
  FIXTURE_SECTION_ID,
  FIXTURE_SESSION_ID,
  FIXTURE_SESSION_ID_2,
} from "./uuids.fixture";

/** Far-future session window so readiness "no_sessions" does not trip in unit tests. */
const FUTURE_START = "2030-03-15T18:00:00.000Z";
const FUTURE_END = "2030-03-15T19:00:00.000Z";

export function makeBookClassEventOption(
  overrides: Partial<BookClassEventOption> = {},
): BookClassEventOption {
  return {
    id: FIXTURE_CLASS_EVENT_ID,
    name: "Salsa Foundations",
    slug: "salsa-foundations",
    ...overrides,
  };
}

export function makeClassSessionPublic(
  overrides: Partial<ClassSessionPublic> = {},
): ClassSessionPublic {
  return {
    id: FIXTURE_SESSION_ID,
    startsAt: FUTURE_START,
    endsAt: FUTURE_END,
    timezone: "America/New_York",
    capacity: 20,
    price: 45,
    currency: "usd",
    seatsRemaining: 12,
    weekday: 5,
    sectionId: FIXTURE_SECTION_ID,
    sectionLabel: "Beginner",
    sectionStartTime: "18:00",
    sectionEndTime: "19:00",
    ...overrides,
  };
}

export function makeRecurringSchedule(
  overrides: Partial<Extract<OnComingEventSchedule, { mode: "RECURRING_WEEKLY" }>> = {},
): Extract<OnComingEventSchedule, { mode: "RECURRING_WEEKLY" }> {
  return {
    mode: "RECURRING_WEEKLY",
    timezone: "America/New_York",
    summary: "Fri · Beginner 6–7pm",
    effectiveFrom: "2030-01-01",
    weekdayLabels: ["Friday"],
    startTime: "18:00",
    endTime: "19:00",
    days: [
      {
        weekday: 5,
        label: "Friday",
        sections: [
          {
            id: FIXTURE_SECTION_ID,
            label: "Beginner",
            startTime: "18:00",
            endTime: "19:00",
            sortOrder: 0,
          },
        ],
      },
    ],
    ...overrides,
  };
}

export function makeMonthPackageOffer(
  overrides: Partial<MonthPackageOffer> = {},
): MonthPackageOffer {
  return {
    enabled: true,
    price: 180,
    label: "March package",
    currentMonthIso: "2030-03",
    currentMonthSessionCount: 4,
    purchasable: true,
    purchasableMonths: ["2030-03", "2030-04"],
    ...overrides,
  };
}

export function makeBookClassEventContext(
  overrides: Partial<BookClassEventContext> = {},
): BookClassEventContext {
  return {
    event: {
      id: FIXTURE_CLASS_EVENT_ID,
      slug: "salsa-foundations",
      name: "Salsa Foundations",
      timezone: "America/New_York",
    },
    schedule: makeRecurringSchedule(),
    sessions: [
      makeClassSessionPublic(),
      makeClassSessionPublic({
        id: FIXTURE_SESSION_ID_2,
        sectionLabel: "Intermediate",
        sectionStartTime: "19:15",
        sectionEndTime: "20:15",
        startsAt: "2030-03-15T19:15:00.000Z",
        endsAt: "2030-03-15T20:15:00.000Z",
      }),
    ],
    monthPackage: makeMonthPackageOffer(),
    readiness: {
      isBookable: true,
      reasons: [],
    },
    ...overrides,
  };
}

export function makeBookClassFormSnapshot(
  overrides: Partial<BookClassFormSnapshot> = {},
): BookClassFormSnapshot {
  return {
    eventId: FIXTURE_CLASS_EVENT_ID,
    bookingKind: "day",
    weekday: 5,
    selectedDateIso: "2030-03-15",
    selectedSessionIds: new Set([FIXTURE_SESSION_ID]),
    monthIso: null,
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "+1 555 0100",
    paymentMethod: "stripe",
    cashConfirmed: false,
    ...overrides,
  };
}

export function makeCreateEnrollmentBody(
  overrides: Partial<CreateAdminClassEnrollmentBody> = {},
): CreateAdminClassEnrollmentBody {
  return {
    purchaseKind: "session",
    upcomingEventId: FIXTURE_CLASS_EVENT_ID,
    sessionId: FIXTURE_SESSION_ID,
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "+1 555 0100",
    ...overrides,
  };
}

export function makeEnrollmentSuccess(overrides: {
  enrollmentId?: string;
  message?: string;
  payUrl?: string;
} = {}) {
  return {
    enrollmentId: overrides.enrollmentId ?? FIXTURE_ENROLLMENT_ID,
    message: overrides.message ?? "Enrollment created.",
    payUrl: overrides.payUrl,
  };
}
