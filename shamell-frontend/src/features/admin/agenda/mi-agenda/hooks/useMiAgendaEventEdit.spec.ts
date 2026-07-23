/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { EnrichedBooking } from "../types/miAgenda.types";
import { useMiAgendaEventEdit } from "./useMiAgendaEventEdit";

function makeBooking(overrides: Partial<EnrichedBooking> = {}): EnrichedBooking {
  return {
    id: "booking-1",
    dateIso: "2026-08-15",
    start: "10:00",
    end: "12:00",
    location: "Studio A",
    notes: "Bring shoes",
    bookingDetails: {
      eventTimeStart: "10:30",
      eventTimeEnd: "11:30",
    },
    ...overrides,
  } as EnrichedBooking;
}

describe("useMiAgendaEventEdit", () => {
  it("clears editing when there is no selection", () => {
    const { result } = renderHook(() => useMiAgendaEventEdit(null));
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editDateIso).toBe("");
  });

  it("seeds edit fields from booking details", () => {
    const { result } = renderHook(() => useMiAgendaEventEdit(makeBooking()));
    expect(result.current.editDateIso).toBe("2026-08-15");
    expect(result.current.editStart).toBe("10:30");
    expect(result.current.editEnd).toBe("11:30");
    expect(result.current.editLocation).toBe("Studio A");
    expect(result.current.editNotes).toBe("Bring shoes");
  });

  it("falls back to start/end when details omit times", () => {
    const { result } = renderHook(() =>
      useMiAgendaEventEdit(makeBooking({ bookingDetails: null })),
    );
    expect(result.current.editStart).toBe("10:00");
    expect(result.current.editEnd).toBe("12:00");
  });

  it("toggles editing", () => {
    const { result } = renderHook(() => useMiAgendaEventEdit(makeBooking()));
    act(() => {
      result.current.toggleEditing();
    });
    expect(result.current.isEditing).toBe(true);
    act(() => {
      result.current.toggleEditing();
    });
    expect(result.current.isEditing).toBe(false);
  });
});
