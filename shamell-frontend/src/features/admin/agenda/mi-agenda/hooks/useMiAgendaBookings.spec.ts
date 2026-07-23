/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const getTokenMock = vi.fn((): string | null => "token-1");
const patchBookingMock = vi.fn(async () => undefined);
const fetchBookingsMock = vi.fn(async () => ({
  bookings: [{ id: "b1", eventDate: "2026-08-15T14:00:00.000Z" }],
}));
const enrichMock = vi.fn((_rows: unknown[], _tz: string) => [
  {
    id: "b1",
    dateIso: "2026-08-15",
    start: "10:00",
    end: "12:00",
  },
]);

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("@/hooks/use-admin-bookings", () => ({
  useAdminBookings: () => ({ patchBooking: patchBookingMock }),
}));

vi.mock("../services/fetchMiAgendaBookings", () => ({
  fetchMiAgendaBookings: (...args: unknown[]) => fetchBookingsMock(...args),
}));

vi.mock("../lib/miAgendaBookingUtils", () => ({
  enrichBookings: (...args: unknown[]) => enrichMock(...args),
}));

import { useMiAgendaBookings } from "./useMiAgendaBookings";

const range = { fromIso: "2026-08-10", toIso: "2026-08-16" };

describe("useMiAgendaBookings", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
    patchBookingMock.mockClear();
    fetchBookingsMock.mockReset();
    fetchBookingsMock.mockResolvedValue({
      bookings: [{ id: "b1", eventDate: "2026-08-15T14:00:00.000Z" }],
    });
    enrichMock.mockClear();
    enrichMock.mockReturnValue([
      { id: "b1", dateIso: "2026-08-15", start: "10:00", end: "12:00" },
    ]);
  });

  it("clears when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() =>
      useMiAgendaBookings(range, "America/New_York"),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(fetchBookingsMock).not.toHaveBeenCalled();
  });

  it("loads and groups bookings by date", async () => {
    const { result } = renderHook(() =>
      useMiAgendaBookings(range, "America/New_York"),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.byDate.get("2026-08-15")).toHaveLength(1);
    expect(fetchBookingsMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        from: "2026-08-10T00:00:00.000Z",
        to: "2026-08-16T23:59:59.999Z",
      }),
    );
  });

  it("sets an error when fetch fails", async () => {
    fetchBookingsMock.mockRejectedValueOnce(new Error("agenda fail"));
    const { result } = renderHook(() =>
      useMiAgendaBookings(range, "America/New_York"),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("agenda fail");
    expect(result.current.items).toEqual([]);
  });

  it("patches then reloads", async () => {
    const { result } = renderHook(() =>
      useMiAgendaBookings(range, "America/New_York"),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fetchBookingsMock.mockClear();
    await act(async () => {
      await result.current.patchBooking("b1", { location: "New place" });
    });
    expect(patchBookingMock).toHaveBeenCalledWith("b1", { location: "New place" });
    await waitFor(() => expect(fetchBookingsMock).toHaveBeenCalled());
  });
});
