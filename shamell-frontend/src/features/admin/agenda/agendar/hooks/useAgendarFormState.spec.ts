/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
} from "../tests/fixtures/uuids.fixture";
import { useAgendarFormState } from "./useAgendarFormState";

describe("useAgendarFormState", () => {
  it("starts with empty fields and incomplete mobile sections", () => {
    const { result } = renderHook(() => useAgendarFormState());
    expect(result.current.guestFullName).toBe("");
    expect(result.current.mobileSectionStatus).toEqual({
      event: false,
      logistics: false,
      client: false,
    });
  });

  it("marks the event section complete when catalog fields are set", () => {
    const { result } = renderHook(() => useAgendarFormState());
    act(() => {
      result.current.setEventTypeId(FIXTURE_EVENT_TYPE_ID);
      result.current.setOccasionTypeId(FIXTURE_OCCASION_ID);
      result.current.setServiceIds([FIXTURE_SERVICE_ID]);
    });
    expect(result.current.mobileSectionStatus.event).toBe(true);
  });

  it("clears notes and guest count after submit", () => {
    const { result } = renderHook(() => useAgendarFormState());
    act(() => {
      result.current.setNotes("Keep me");
      result.current.setGuestCount("50");
    });
    act(() => {
      result.current.clearNotesAndGuestCountAfterSubmit();
    });
    expect(result.current.notes).toBe("");
    expect(result.current.guestCount).toBe("");
  });
});
