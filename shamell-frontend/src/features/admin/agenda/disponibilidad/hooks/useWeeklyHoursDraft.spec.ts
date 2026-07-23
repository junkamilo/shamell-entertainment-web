/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWeeklyHoursDraft } from "./useWeeklyHoursDraft";
import { defaultWeekly } from "../lib/disponibilidadConstants";
import { makeAdminAvailabilitySnapshot } from "../test/fixtures/disponibilidad.fixture";
import type { AdminAvailabilitySnapshot } from "../types/disponibilidad.types";

describe("useWeeklyHoursDraft", () => {
  it("starts as defaultWeekly() when there is no snapshot", () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(null));
    expect(result.current.weeklyDraft).toEqual(defaultWeekly());
    expect(result.current.savingWeekly).toBe(false);
  });

  it("syncs draft rows when the snapshot has 7 days", () => {
    const baseWeekly = makeAdminAvailabilitySnapshot().weekly;
    const snapshot = makeAdminAvailabilitySnapshot({
      weekly: baseWeekly.map((w) =>
        w.weekday === 1 ? { ...w, startTime: "10:00", endTime: "18:00" } : w,
      ),
    });

    const { result, rerender } = renderHook(
      (props: { snapshot: AdminAvailabilitySnapshot | null }) =>
        useWeeklyHoursDraft(props.snapshot),
      { initialProps: { snapshot: null } },
    );

    rerender({ snapshot });

    const monday = result.current.weeklyDraft.find((w) => w.weekday === 1);
    expect(monday?.startTime).toBe("10:00");
    expect(monday?.endTime).toBe("18:00");
  });

  it("does not sync when the snapshot weekly length is not 7", () => {
    const snapshot = makeAdminAvailabilitySnapshot({
      weekly: makeAdminAvailabilitySnapshot().weekly.slice(0, 3),
    });
    const { result } = renderHook(() => useWeeklyHoursDraft(snapshot));
    expect(result.current.weeklyDraft).toEqual(defaultWeekly());
  });

  it("updateRowClosed nulls the start/end time when closing a day", () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(null));

    act(() => {
      result.current.updateRowClosed(1, true);
    });

    const monday = result.current.weeklyDraft.find((w) => w.weekday === 1);
    expect(monday?.isClosed).toBe(true);
    expect(monday?.startTime).toBeNull();
    expect(monday?.endTime).toBeNull();
  });

  it("updateRowClosed restores default 09:00-21:00 when reopening a day with no prior times", () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(null));

    act(() => {
      result.current.updateRowClosed(0, false);
    });

    const sunday = result.current.weeklyDraft.find((w) => w.weekday === 0);
    expect(sunday?.isClosed).toBe(false);
    expect(sunday?.startTime).toBe("09:00");
    expect(sunday?.endTime).toBe("21:00");
  });

  it("updateRowClosed preserves existing times when reopening a day that already had them", () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(null));

    act(() => {
      result.current.setRowTime(2, "start", "11:00");
      result.current.setRowTime(2, "end", "19:00");
      result.current.updateRowClosed(2, true);
    });
    act(() => {
      result.current.updateRowClosed(2, false);
    });

    const tuesday = result.current.weeklyDraft.find((w) => w.weekday === 2);
    expect(tuesday?.startTime).toBe("09:00");
    expect(tuesday?.endTime).toBe("21:00");
  });

  it("setRowTime updates the start/end time for the given weekday only", () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(null));

    act(() => {
      result.current.setRowTime(2, "start", "11:00");
      result.current.setRowTime(2, "end", "19:00");
    });

    const tuesday = result.current.weeklyDraft.find((w) => w.weekday === 2);
    expect(tuesday?.startTime).toBe("11:00");
    expect(tuesday?.endTime).toBe("19:00");

    const monday = result.current.weeklyDraft.find((w) => w.weekday === 1);
    expect(monday?.startTime).toBe("09:00");
  });

  it("sortedRows returns rows ordered by weekday", () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(null));
    const weekdays = result.current.sortedRows.map((r) => r.weekday);
    expect(weekdays).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
