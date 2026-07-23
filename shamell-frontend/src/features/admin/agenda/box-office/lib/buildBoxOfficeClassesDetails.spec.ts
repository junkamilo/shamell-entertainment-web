import { describe, expect, it } from "vitest";
import { makeDaySectionOffer } from "../test/fixtures/boxOffice.fixture";
import {
  FIXTURE_CLASS_EVENT_ID,
  FIXTURE_SECTION_ID,
  FIXTURE_SESSION_ID,
  FIXTURE_SESSION_ID_2,
} from "../test/fixtures/uuids.fixture";
import { buildBoxOfficeClassesDetails } from "./buildBoxOfficeClassesDetails";

const baseArgs = {
  upcomingEventId: FIXTURE_CLASS_EVENT_ID,
  paymentMethod: "cash" as const,
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  customerPhone: "",
  monthIso: null,
  monthPackageLabel: null,
  monthPackagePrice: null,
  monthSessionCount: null,
  monthSessionIds: [] as string[],
};

describe("buildBoxOfficeClassesDetails", () => {
  it("builds a session selection from the matching section offer", () => {
    const offer = makeDaySectionOffer();
    const payload = buildBoxOfficeClassesDetails({
      ...baseArgs,
      purchaseKind: "session",
      selectedDateIso: "2030-03-15",
      weekday: 5,
      sessionIds: [FIXTURE_SESSION_ID],
      sectionOffers: [offer],
    });

    expect(payload.mode).toBe("classes");
    expect(payload.purchaseKind).toBe("session");
    expect(payload.selection).toEqual({
      kind: "session",
      sessionId: FIXTURE_SESSION_ID,
      dateIso: "2030-03-15",
      weekday: 5,
      sectionId: FIXTURE_SECTION_ID,
      sectionLabel: "Beginner",
      startTime: "18:00",
      endTime: "19:00",
      amount: 30,
      currency: "usd",
    });
  });

  it("builds a day_bundle selection with per-session items and a summed amount", () => {
    const offer1 = makeDaySectionOffer();
    const offer2 = makeDaySectionOffer({
      sectionId: "sec-2",
      label: "Intermediate",
      startTime: "19:15",
      endTime: "20:15",
      sessionId: FIXTURE_SESSION_ID_2,
      price: 40,
    });

    const payload = buildBoxOfficeClassesDetails({
      ...baseArgs,
      purchaseKind: "day_bundle",
      selectedDateIso: "2030-03-15",
      weekday: 5,
      sessionIds: [FIXTURE_SESSION_ID, FIXTURE_SESSION_ID_2],
      sectionOffers: [offer1, offer2],
    });

    expect(payload.purchaseKind).toBe("day_bundle");
    expect(payload.selection).toMatchObject({
      kind: "day_bundle",
      dateIso: "2030-03-15",
      weekday: 5,
      sessionIds: [FIXTURE_SESSION_ID, FIXTURE_SESSION_ID_2],
      amount: 70,
      currency: "usd",
    });
    expect(
      (payload.selection.items as Array<{ sessionId: string }>).map(
        (item) => item.sessionId,
      ),
    ).toEqual([FIXTURE_SESSION_ID, FIXTURE_SESSION_ID_2]);
  });

  it("falls back to null item fields when a session has no matching offer", () => {
    const payload = buildBoxOfficeClassesDetails({
      ...baseArgs,
      purchaseKind: "day_bundle",
      selectedDateIso: "2030-03-15",
      weekday: 5,
      sessionIds: [FIXTURE_SESSION_ID],
      sectionOffers: [],
    });

    expect(payload.selection).toMatchObject({
      amount: 0,
      items: [
        {
          sessionId: FIXTURE_SESSION_ID,
          sectionId: null,
          sectionLabel: null,
          startTime: null,
          endTime: null,
          amount: null,
        },
      ],
    });
  });

  it("builds a month_package selection from the month package fields", () => {
    const payload = buildBoxOfficeClassesDetails({
      ...baseArgs,
      purchaseKind: "month_package",
      selectedDateIso: null,
      weekday: null,
      sessionIds: [],
      sectionOffers: [],
      monthIso: "2030-03",
      monthPackageLabel: "March package",
      monthPackagePrice: 180,
      monthSessionCount: 4,
      monthSessionIds: [FIXTURE_SESSION_ID, FIXTURE_SESSION_ID_2],
    });

    expect(payload.purchaseKind).toBe("month_package");
    expect(payload.selection).toEqual({
      kind: "month_package",
      monthIso: "2030-03",
      label: "March package",
      price: 180,
      sessionCount: 4,
      sessionIds: [FIXTURE_SESSION_ID, FIXTURE_SESSION_ID_2],
      currency: "usd",
    });
  });

  it("trims/lowercases the customer and maps a blank phone to null", () => {
    const payload = buildBoxOfficeClassesDetails({
      ...baseArgs,
      purchaseKind: "session",
      customerName: "  Jane Doe  ",
      customerEmail: "  JANE@EXAMPLE.COM  ",
      customerPhone: "   ",
      selectedDateIso: "2030-03-15",
      weekday: 5,
      sessionIds: [FIXTURE_SESSION_ID],
      sectionOffers: [makeDaySectionOffer()],
    });

    expect(payload.customer).toEqual({
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: null,
    });
  });

  it("stamps submittedAt as a parseable ISO string", () => {
    const payload = buildBoxOfficeClassesDetails({
      ...baseArgs,
      purchaseKind: "session",
      selectedDateIso: "2030-03-15",
      weekday: 5,
      sessionIds: [FIXTURE_SESSION_ID],
      sectionOffers: [makeDaySectionOffer()],
    });

    expect(typeof payload.submittedAt).toBe("string");
    expect(Number.isNaN(Date.parse(payload.submittedAt))).toBe(false);
  });
});
