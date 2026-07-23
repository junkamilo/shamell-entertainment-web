/** @vitest-environment jsdom */

import type { FormEvent } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const toastMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/disponibilidadAuth", () => ({
  getDisponibilidadBearerToken: () => "token-1",
  getDisponibilidadAuthHeaders: () => ({ "Content-Type": "application/json" }),
}));

import { useDisponibilidadPage } from "./useDisponibilidadPage";

function makeFormEvent(): FormEvent {
  return { preventDefault: vi.fn() } as unknown as FormEvent;
}

describe("useDisponibilidadPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
  });

  it("starts on the weekly panel and can switch to closures", async () => {
    const { result } = renderHook(() => useDisponibilidadPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.activePanel).toBe("weekly");

    act(() => {
      result.current.setActivePanel("closures");
    });

    expect(result.current.activePanel).toBe("closures");
  });

  it("onSaveWeekly shows a 'Hours saved' toast on success", async () => {
    const { result } = renderHook(() => useDisponibilidadPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.onSaveWeekly(makeFormEvent());
    });

    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Hours saved" }));
    expect(result.current.weekly.savingWeekly).toBe(false);
  });

  it("onAddClosure validates a missing SPECIFIC_DATE closure date", async () => {
    const { result } = renderHook(() => useDisponibilidadPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.onAddClosure(makeFormEvent());
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        description: "Pick a date for this one-day closure.",
        variant: "destructive",
      }),
    );
  });

  it("onAddClosure adds a SPECIFIC_DATE closure successfully and resets the form", async () => {
    const { result } = renderHook(() => useDisponibilidadPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.closure.setClosureDate("2030-12-25");
    });

    await act(async () => {
      await result.current.onAddClosure(makeFormEvent());
    });

    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Closure added" }));
    expect(result.current.closure.closureDate).toBe("");
  });

  it("onAddClosure validates missing DATE_RANGE start/end dates", async () => {
    const { result } = renderHook(() => useDisponibilidadPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.closure.onClosureKindChange("DATE_RANGE");
    });

    await act(async () => {
      await result.current.onAddClosure(makeFormEvent());
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        description: "Pick start and end dates.",
        variant: "destructive",
      }),
    );
  });

  it("onAddClosure adds a RECURRING_WEEKDAY closure successfully", async () => {
    const { result } = renderHook(() => useDisponibilidadPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.closure.onClosureKindChange("RECURRING_WEEKDAY");
    });

    await act(async () => {
      await result.current.onAddClosure(makeFormEvent());
    });

    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Closure added" }));
  });

  it("keeps panel state independent of the closure/weekly sub-hooks", async () => {
    const { result } = renderHook(() => useDisponibilidadPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setTimePickerTarget({ weekday: 1, field: "start" });
    });

    expect(result.current.timePickerTarget).toEqual({ weekday: 1, field: "start" });
    expect(result.current.pickerValue).toBe("09:00");
  });
});
