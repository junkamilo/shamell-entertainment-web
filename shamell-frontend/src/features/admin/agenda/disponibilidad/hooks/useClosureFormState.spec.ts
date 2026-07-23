/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useClosureFormState } from "./useClosureFormState";

describe("useClosureFormState", () => {
  it("defaults to SPECIFIC_DATE with empty fields", () => {
    const { result } = renderHook(() => useClosureFormState());
    expect(result.current.closureKind).toBe("SPECIFIC_DATE");
    expect(result.current.closureDate).toBe("");
    expect(result.current.closureStartDate).toBe("");
    expect(result.current.closureEndDate).toBe("");
    expect(result.current.closureWeekday).toBe(0);
    expect(result.current.closureNote).toBe("");
    expect(result.current.addingClosure).toBe(false);
    expect(result.current.confirmClosureId).toBeNull();
    expect(result.current.closureDatePickerTarget).toBeNull();
  });

  it("resetClosureFields clears dates and note", () => {
    const { result } = renderHook(() => useClosureFormState());

    act(() => {
      result.current.setClosureDate("2030-01-01");
      result.current.setClosureStartDate("2030-01-02");
      result.current.setClosureEndDate("2030-01-03");
      result.current.setClosureNote("Some note");
    });

    act(() => {
      result.current.resetClosureFields();
    });

    expect(result.current.closureDate).toBe("");
    expect(result.current.closureStartDate).toBe("");
    expect(result.current.closureEndDate).toBe("");
    expect(result.current.closureNote).toBe("");
  });

  it("onClosureKindChange updates the kind and clears the date picker target", () => {
    const { result } = renderHook(() => useClosureFormState());

    act(() => {
      result.current.setClosureDatePickerTarget("start");
    });
    expect(result.current.closureDatePickerTarget).toBe("start");

    act(() => {
      result.current.onClosureKindChange("DATE_RANGE");
    });

    expect(result.current.closureKind).toBe("DATE_RANGE");
    expect(result.current.closureDatePickerTarget).toBeNull();
  });

  it("onClosureDateConfirm sets closureDate for the single target", () => {
    const { result } = renderHook(() => useClosureFormState());

    act(() => {
      result.current.setClosureDatePickerTarget("single");
    });
    act(() => {
      result.current.onClosureDateConfirm("2030-05-05");
    });

    expect(result.current.closureDate).toBe("2030-05-05");
    expect(result.current.closureStartDate).toBe("");
    expect(result.current.closureEndDate).toBe("");
  });

  it("onClosureDateConfirm sets closureStartDate for the start target", () => {
    const { result } = renderHook(() => useClosureFormState());

    act(() => {
      result.current.setClosureDatePickerTarget("start");
    });
    act(() => {
      result.current.onClosureDateConfirm("2030-06-01");
    });

    expect(result.current.closureStartDate).toBe("2030-06-01");
    expect(result.current.closureDate).toBe("");
  });

  it("onClosureDateConfirm sets closureEndDate for the end target", () => {
    const { result } = renderHook(() => useClosureFormState());

    act(() => {
      result.current.setClosureDatePickerTarget("end");
    });
    act(() => {
      result.current.onClosureDateConfirm("2030-06-10");
    });

    expect(result.current.closureEndDate).toBe("2030-06-10");
    expect(result.current.closureStartDate).toBe("");
  });

  it("defaults to the single-date behavior when no target has been set", () => {
    const { result } = renderHook(() => useClosureFormState());

    act(() => {
      result.current.onClosureDateConfirm("2030-07-04");
    });

    expect(result.current.closureDate).toBe("2030-07-04");
  });
});
