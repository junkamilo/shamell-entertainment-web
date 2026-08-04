import { describe, expect, it, vi } from "vitest";
import {
  buildMonthPackagePreview,
  countMonthSessions,
  formatMonthLabel,
  isMonthPackagePurchasable,
  listMonthSessions,
} from "./buildMonthPackagePreview";
import { makeClassSession, makeMonthPackage } from "../test/fixtures/onComingEvents.fixture";

describe("countMonthSessions", () => {
  it("counts future sessions in the target month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-08-01T12:00:00.000Z"));
    const sessions = [
      makeClassSession({ startsAt: "2030-08-04T23:00:00.000Z", endsAt: "2030-08-05T00:00:00.000Z" }),
      makeClassSession({
        id: "past",
        startsAt: "2030-07-04T23:00:00.000Z",
        endsAt: "2030-07-05T00:00:00.000Z",
      }),
      makeClassSession({
        id: "other-month",
        startsAt: "2030-09-04T23:00:00.000Z",
        endsAt: "2030-09-05T00:00:00.000Z",
      }),
    ];
    expect(countMonthSessions(sessions, "2030-08", "America/New_York")).toBe(1);
    vi.useRealTimers();
  });
});

describe("listMonthSessions", () => {
  it("returns sorted future sessions for the month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-08-01T12:00:00.000Z"));
    const later = makeClassSession({
      id: "later",
      startsAt: "2030-08-18T23:00:00.000Z",
      endsAt: "2030-08-19T00:00:00.000Z",
    });
    const earlier = makeClassSession({
      id: "earlier",
      startsAt: "2030-08-04T23:00:00.000Z",
      endsAt: "2030-08-05T00:00:00.000Z",
    });
    const listed = listMonthSessions([later, earlier], "2030-08", "America/New_York");
    expect(listed.map((session) => session.id)).toEqual(["earlier", "later"]);
    vi.useRealTimers();
  });
});

describe("isMonthPackagePurchasable", () => {
  it("returns true only when offer is purchasable", () => {
    expect(isMonthPackagePurchasable(makeMonthPackage({ purchasable: true }))).toBe(true);
    expect(isMonthPackagePurchasable(makeMonthPackage({ purchasable: false }))).toBe(false);
    expect(isMonthPackagePurchasable(null)).toBe(false);
  });
});

describe("formatMonthLabel", () => {
  it("formats month iso as long month and year", () => {
    expect(formatMonthLabel("2030-08")).toBe("August 2030");
  });

  it("returns original string for invalid iso", () => {
    expect(formatMonthLabel("bad")).toBe("bad");
  });
});

describe("buildMonthPackagePreview", () => {
  it("builds preview with session count and weekday summary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-08-01T12:00:00.000Z"));
    const preview = buildMonthPackagePreview({
      monthIso: "2030-08",
      sessions: [makeClassSession()],
      timezone: "America/New_York",
      weekdayLabels: ["Mon", "Wed"],
    });
    expect(preview).toEqual({
      sessionCount: 1,
      weekdaySummary: "Mon, Wed",
      monthLabel: "August 2030",
    });
    vi.useRealTimers();
  });
});
