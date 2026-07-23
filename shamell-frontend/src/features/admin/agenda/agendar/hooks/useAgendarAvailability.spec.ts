/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const usePublicAvailabilityMock = vi.fn();

vi.mock("@/hooks/use-public-availability", () => ({
  usePublicAvailability: (...args: unknown[]) => usePublicAvailabilityMock(...args),
}));

vi.mock("@/lib/bookingAvailability", () => ({
  expandBlockedDates: vi.fn(() => new Set(["2026-08-01"])),
  expandBlockedDateReasonsMap: vi.fn(() => new Map([["2026-08-01", "Closed"]])),
  isoDateInTzNow: vi.fn(() => "2026-07-22"),
  timeBoundsForDateISO: vi.fn(() => ({ min: "09:00", max: "22:00" })),
  utcInstantForWallClock: vi.fn(),
}));

import { useAgendarAvailability } from "./useAgendarAvailability";
import {
  expandBlockedDates,
  expandBlockedDateReasonsMap,
  timeBoundsForDateISO,
} from "@/lib/bookingAvailability";

describe("useAgendarAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty blocks when rules are missing", () => {
    usePublicAvailabilityMock.mockReturnValue({ rules: null });
    const { result } = renderHook(() => useAgendarAvailability("2026-08-15", { polling: false }));

    expect(result.current.blockedIsoDates.size).toBe(0);
    expect(result.current.blockedReasonByIso.size).toBe(0);
    expect(result.current.startTimeClamp).toBeUndefined();
    expect(result.current.minSelectableIso).toBeUndefined();
    expect(result.current.bookingTz).toBe("America/New_York");
  });

  it("derives blocks and clamps from public rules", () => {
    usePublicAvailabilityMock.mockReturnValue({
      rules: {
        timeZone: "America/Chicago",
        weekly: { mon: [{ start: "09:00", end: "17:00" }] },
        closures: [],
      },
    });

    const { result } = renderHook(() => useAgendarAvailability("2026-08-15", { polling: false }));

    expect(result.current.bookingTz).toBe("America/Chicago");
    expect(result.current.blockedIsoDates.has("2026-08-01")).toBe(true);
    expect(result.current.blockedReasonByIso.get("2026-08-01")).toBe("Closed");
    expect(result.current.minSelectableIso).toBe("2026-07-22");
    expect(result.current.startTimeClamp).toEqual({ min: "09:00", max: "22:00" });
    expect(expandBlockedDates).toHaveBeenCalled();
    expect(expandBlockedDateReasonsMap).toHaveBeenCalled();
    expect(timeBoundsForDateISO).toHaveBeenCalledWith(
      "2026-08-15",
      "America/Chicago",
      expect.anything(),
    );
  });

  it("skips time clamp when event date is empty", () => {
    usePublicAvailabilityMock.mockReturnValue({
      rules: {
        timeZone: "America/Chicago",
        weekly: { mon: [{ start: "09:00", end: "17:00" }] },
        closures: [],
      },
    });

    const { result } = renderHook(() => useAgendarAvailability("", { polling: false }));

    expect(result.current.startTimeClamp).toBeUndefined();
    expect(timeBoundsForDateISO).not.toHaveBeenCalled();
    expect(result.current.minSelectableIso).toBe("2026-07-22");
  });

  it("enables public availability polling by default", () => {
    usePublicAvailabilityMock.mockReturnValue({ rules: null });
    renderHook(() => useAgendarAvailability("2026-08-15"));
    expect(usePublicAvailabilityMock).toHaveBeenCalledWith(true, { polling: true });
  });
});
