/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("../lib/miAgendaDateUtils", () => ({
  bookingTimeZone: () => "America/New_York",
  isoFromTzDate: () => "2026-07-22",
  mondayStartIso: (iso: string) => {
    if (iso === "2026-07-22" || iso.startsWith("2026-07")) return "2026-07-20";
    if (iso === "2026-07-01") return "2026-06-29";
    return iso;
  },
  monthStartIso: () => "2026-07-01",
  monthEndIso: () => "2026-07-31",
  addDaysIso: (iso: string, days: number) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  },
  shiftAnchor: (iso: string, mode: string, dir: number) => {
    if (mode === "week") {
      const d = new Date(`${iso}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + dir * 7);
      return d.toISOString().slice(0, 10);
    }
    return iso;
  },
}));

import { useMiAgendaCalendar } from "./useMiAgendaCalendar";

describe("useMiAgendaCalendar", () => {
  it("defaults to week range Mon–Sun around today", () => {
    const { result } = renderHook(() => useMiAgendaCalendar());
    expect(result.current.viewMode).toBe("week");
    expect(result.current.todayIso).toBe("2026-07-22");
    expect(result.current.range).toEqual({ fromIso: "2026-07-20", toIso: "2026-07-26" });
    expect(result.current.weekDays).toHaveLength(7);
  });

  it("uses a single-day range in day mode", () => {
    const { result } = renderHook(() => useMiAgendaCalendar());
    act(() => {
      result.current.setViewMode("day");
    });
    expect(result.current.range).toEqual({ fromIso: "2026-07-22", toIso: "2026-07-22" });
  });

  it("builds a 42-cell month grid", () => {
    const { result } = renderHook(() => useMiAgendaCalendar());
    act(() => {
      result.current.setViewMode("month");
    });
    expect(result.current.monthGrid).toHaveLength(42);
    expect(result.current.range).toEqual({ fromIso: "2026-07-01", toIso: "2026-07-31" });
  });

  it("navigates prev/next and goToday", () => {
    const { result } = renderHook(() => useMiAgendaCalendar());
    act(() => {
      result.current.goNext();
    });
    expect(result.current.anchorIso).toBe("2026-07-29");
    act(() => {
      result.current.goPrev();
    });
    expect(result.current.anchorIso).toBe("2026-07-22");
    act(() => {
      result.current.goNext();
    });
    act(() => {
      result.current.goToday();
    });
    expect(result.current.anchorIso).toBe("2026-07-22");
  });
});
