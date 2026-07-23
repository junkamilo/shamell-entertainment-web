import { groupMonthSessionsByWeek } from "./groupMonthSessionsByWeek";
import type { ClassSessionPublic } from "../services/fetchUpcomingClassSessions";

function session(partial: Partial<ClassSessionPublic> & { id: string }): ClassSessionPublic {
  return {
    id: partial.id,
    startsAt: "2026-06-08T14:00:00.000Z",
    endsAt: "2026-06-08T16:00:00.000Z",
    timezone: "America/New_York",
    capacity: 20,
    price: 20,
    currency: "usd",
    seatsRemaining: 10,
    sectionId: "sec-1",
    sectionLabel: "Morning",
    sectionStartTime: "10:00",
    sectionEndTime: "12:00",
    ...partial,
  };
}

describe("groupMonthSessionsByWeek", () => {
  it("groups sessions into week buckets for the same month", () => {
    const groups = groupMonthSessionsByWeek(
      [
        session({ id: "s1", startsAt: "2026-06-03T14:00:00.000Z" }),
        session({ id: "s2", startsAt: "2026-06-08T14:00:00.000Z" }),
        session({ id: "s3", startsAt: "2026-06-09T14:00:00.000Z" }),
      ],
      "2026-06",
      "America/New_York",
    );

    expect(groups).toHaveLength(2);
    expect(groups[0]?.weekIndex).toBe(1);
    expect(groups[0]?.sessions.map((item) => item.id)).toEqual(["s1"]);
    expect(groups[1]?.weekIndex).toBe(2);
    expect(groups[1]?.sessions.map((item) => item.id)).toEqual(["s2", "s3"]);
  });

  it("uses session timezone when computing month/week boundaries", () => {
    const groups = groupMonthSessionsByWeek(
      [
        session({
          id: "s1",
          startsAt: "2026-07-01T03:30:00.000Z",
          timezone: "America/New_York",
        }),
      ],
      "2026-06",
      "UTC",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.weekIndex).toBe(5);
    expect(groups[0]?.sessions[0]?.id).toBe("s1");
  });

  it("returns only populated week groups for late-month sessions", () => {
    const groups = groupMonthSessionsByWeek(
      [
        session({ id: "s1", startsAt: "2026-06-22T14:00:00.000Z" }),
        session({ id: "s2", startsAt: "2026-06-30T14:00:00.000Z" }),
      ],
      "2026-06",
      "America/New_York",
    );

    expect(groups).toHaveLength(2);
    expect(groups.map((item) => item.weekIndex)).toEqual([4, 5]);
  });
});
