/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { FIXTURE_SESSION_ID, FIXTURE_SESSION_ID_2 } from "../test/fixtures/uuids.fixture";
import { useBookClassFormState } from "./useBookClassFormState";

describe("useBookClassFormState", () => {
  it("starts with empty day/stripe defaults", () => {
    const { result } = renderHook(() => useBookClassFormState());
    expect(result.current.eventId).toBe("");
    expect(result.current.bookingKind).toBe("day");
    expect(result.current.paymentMethod).toBe("stripe");
    expect(result.current.selectedSessionIds.size).toBe(0);
  });

  it("toggles session ids on and off", () => {
    const { result } = renderHook(() => useBookClassFormState());

    act(() => {
      result.current.toggleSessionId(FIXTURE_SESSION_ID);
      result.current.toggleSessionId(FIXTURE_SESSION_ID_2);
    });
    expect(result.current.selectedSessionIds.has(FIXTURE_SESSION_ID)).toBe(true);
    expect(result.current.selectedSessionIds.has(FIXTURE_SESSION_ID_2)).toBe(true);

    act(() => {
      result.current.toggleSessionId(FIXTURE_SESSION_ID);
    });
    expect(result.current.selectedSessionIds.has(FIXTURE_SESSION_ID)).toBe(false);
    expect(result.current.selectedSessionIds.has(FIXTURE_SESSION_ID_2)).toBe(true);
  });

  it("clears guest fields after submit", () => {
    const { result } = renderHook(() => useBookClassFormState());

    act(() => {
      result.current.setCustomerName("Ada");
      result.current.setCustomerEmail("ada@example.com");
      result.current.setCustomerPhone("555");
      result.current.toggleSessionId(FIXTURE_SESSION_ID);
      result.current.setCashConfirmed(true);
    });
    act(() => {
      result.current.resetAfterSubmit();
    });

    expect(result.current.customerName).toBe("");
    expect(result.current.customerEmail).toBe("");
    expect(result.current.customerPhone).toBe("");
    expect(result.current.selectedSessionIds.size).toBe(0);
    expect(result.current.cashConfirmed).toBe(false);
  });

  it("resets schedule fields when the event changes", () => {
    const { result } = renderHook(() => useBookClassFormState());

    act(() => {
      result.current.setBookingKind("month");
      result.current.setWeekday(5);
      result.current.setSelectedDateIso("2030-03-15");
      result.current.setMonthIso("2030-03");
      result.current.toggleSessionId(FIXTURE_SESSION_ID);
    });
    act(() => {
      result.current.resetForEventChange();
    });

    expect(result.current.bookingKind).toBe("day");
    expect(result.current.weekday).toBeNull();
    expect(result.current.selectedDateIso).toBeNull();
    expect(result.current.monthIso).toBeNull();
    expect(result.current.selectedSessionIds.size).toBe(0);
  });
});
