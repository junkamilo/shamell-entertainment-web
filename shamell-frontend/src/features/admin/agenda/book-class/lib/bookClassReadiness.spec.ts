import { describe, it, expect, vi, afterEach } from "vitest";
import {
  makeBookClassEventContext,
  makeClassSessionPublic,
  makeRecurringSchedule,
} from "../test/fixtures/bookClass.fixture";
import {
  getBookClassSetupIssues,
  isBookableClassContext,
} from "./bookClassReadiness";

describe("isBookableClassContext", () => {
  it("trusts readiness.isBookable when present", () => {
    expect(
      isBookableClassContext(
        makeBookClassEventContext({
          readiness: { isBookable: false, reasons: ["no_sessions"] },
        }),
      ),
    ).toBe(false);

    expect(
      isBookableClassContext(
        makeBookClassEventContext({
          readiness: { isBookable: true, reasons: [] },
        }),
      ),
    ).toBe(true);
  });

  it("derives bookable when readiness is omitted and context is valid", () => {
    const { readiness: _ignored, ...rest } = makeBookClassEventContext();
    expect(isBookableClassContext(rest)).toBe(true);
  });
});

describe("getBookClassSetupIssues", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps explicit readiness reasons to messages", () => {
    expect(
      getBookClassSetupIssues(
        makeBookClassEventContext({
          readiness: {
            isBookable: false,
            reasons: ["missing_slug", "no_sessions"],
          },
        }),
      ),
    ).toEqual([
      "Event slug is missing.",
      "No upcoming sessions with available seats.",
    ]);
  });

  it("derives missing_slug and not_recurring from context", () => {
    const issues = getBookClassSetupIssues(
      makeBookClassEventContext({
        readiness: undefined,
        event: {
          id: "evt",
          slug: "",
          name: "Broken",
          timezone: "America/New_York",
        },
        schedule: {
          mode: "FIXED_EVENT",
          timezone: "America/New_York",
          summary: "One night",
          salesWindow: null,
          eventDate: "2030-01-01",
          startTime: "18:00",
          endTime: "20:00",
        },
        sessions: [],
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        "Event slug is missing.",
        "Recurring Weekdays (Classes) schedule is not configured.",
        "No upcoming sessions with available seats.",
      ]),
    );
  });

  it("derives no_weekdays and no_sections for empty recurring schedule", () => {
    const issues = getBookClassSetupIssues(
      makeBookClassEventContext({
        readiness: undefined,
        schedule: makeRecurringSchedule({ days: [] }),
        sessions: [makeClassSessionPublic()],
      }),
    );

    expect(issues).toContain("No active class weekdays are configured.");
  });

  it("derives no_sections when weekdays have empty sections", () => {
    const issues = getBookClassSetupIssues(
      makeBookClassEventContext({
        readiness: undefined,
        schedule: makeRecurringSchedule({
          days: [{ weekday: 5, label: "Friday", sections: [] }],
        }),
        sessions: [makeClassSessionPublic()],
      }),
    );

    expect(issues).toContain("No active class sections are configured.");
  });

  it("treats past or sold-out sessions as no_sessions", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-01T12:00:00.000Z"));

    const issues = getBookClassSetupIssues(
      makeBookClassEventContext({
        readiness: undefined,
        sessions: [
          makeClassSessionPublic({
            endsAt: "2030-03-15T19:00:00.000Z",
            seatsRemaining: 5,
          }),
          makeClassSessionPublic({
            id: "sold-out",
            endsAt: "2030-07-01T19:00:00.000Z",
            seatsRemaining: 0,
          }),
        ],
      }),
    );

    expect(issues).toContain("No upcoming sessions with available seats.");
  });
});
