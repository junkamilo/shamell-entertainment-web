/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const fetchOccupiedMock = vi.fn(async () => [{ start: "10:00", end: "12:00" }]);

vi.mock("@/features/contacto/services/fetchOccupiedRanges", () => ({
  fetchOccupiedRanges: (...args: unknown[]) => fetchOccupiedMock(...args),
}));

import { useAgendarOccupiedRanges } from "./useAgendarOccupiedRanges";

describe("useAgendarOccupiedRanges", () => {
  beforeEach(() => {
    fetchOccupiedMock.mockClear();
    fetchOccupiedMock.mockResolvedValue([{ start: "10:00", end: "12:00" }]);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears ranges when there is no date", async () => {
    const { result } = renderHook(() =>
      useAgendarOccupiedRanges("", { polling: false }),
    );
    await waitFor(() => expect(result.current.occupiedRanges).toEqual([]));
    expect(fetchOccupiedMock).not.toHaveBeenCalled();
  });

  it("loads occupied ranges for a date", async () => {
    const { result } = renderHook(() =>
      useAgendarOccupiedRanges("2026-08-15", { polling: false }),
    );

    await waitFor(() =>
      expect(result.current.occupiedRanges).toEqual([{ start: "10:00", end: "12:00" }]),
    );
    expect(fetchOccupiedMock).toHaveBeenCalledWith("2026-08-15");
  });

  it("clears ranges when the fetch fails", async () => {
    fetchOccupiedMock.mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() =>
      useAgendarOccupiedRanges("2026-08-15", { polling: false }),
    );

    await waitFor(() => expect(result.current.occupiedRanges).toEqual([]));
  });
});
