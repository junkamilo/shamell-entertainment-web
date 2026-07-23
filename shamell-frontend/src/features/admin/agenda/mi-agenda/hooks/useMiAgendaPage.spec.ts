/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const toastMock = vi.fn();
const patchBooking = vi.fn(async () => undefined);
const setIsEditing = vi.fn();
const setSavingEdit = vi.fn();

let editStart = "10:00";
let editEnd = "12:00";

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/lib/contactLogisticsUtils", () => ({
  hhmmToMinutes: (value: string) => {
    const [h, m] = value.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  },
}));

vi.mock("@/lib/bookingAvailability", () => ({
  utcInstantForWallClock: () => new Date("2026-08-15T14:00:00.000Z"),
}));

vi.mock("./useMiAgendaCalendar", () => ({
  useMiAgendaCalendar: () => ({
    tz: "America/New_York",
    range: { fromIso: "2026-08-10", toIso: "2026-08-16" },
  }),
}));

vi.mock("./useMiAgendaBookings", () => ({
  useMiAgendaBookings: () => ({
    items: [
      {
        id: "b1",
        location: "Studio",
        notes: "n",
        bookingDetails: { eventTimeStart: "10:00", eventTimeEnd: "12:00" },
      },
    ],
    patchBooking,
  }),
}));

vi.mock("./useMiAgendaEventEdit", () => ({
  useMiAgendaEventEdit: () => ({
    editDateIso: "2026-08-15",
    get editStart() {
      return editStart;
    },
    get editEnd() {
      return editEnd;
    },
    editLocation: "Studio",
    editNotes: "n",
    setIsEditing,
    setSavingEdit,
  }),
}));

import { useMiAgendaPage } from "./useMiAgendaPage";

describe("useMiAgendaPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    patchBooking.mockClear();
    setIsEditing.mockClear();
    setSavingEdit.mockClear();
    editStart = "10:00";
    editEnd = "12:00";
  });

  it("selects a booking from items", () => {
    const { result } = renderHook(() => useMiAgendaPage());
    act(() => {
      result.current.setSelectedId("b1");
    });
    expect(result.current.selected?.id).toBe("b1");
  });

  it("toasts on invalid edit time range", async () => {
    editStart = "12:00";
    editEnd = "10:00";
    const { result } = renderHook(() => useMiAgendaPage());
    act(() => {
      result.current.setSelectedId("b1");
    });
    await act(async () => {
      await result.current.onSaveEdit();
    });
    expect(patchBooking).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Invalid time range" }),
    );
  });

  it("saves an edit and exits editing", async () => {
    const { result } = renderHook(() => useMiAgendaPage());
    act(() => {
      result.current.setSelectedId("b1");
    });
    await act(async () => {
      await result.current.onSaveEdit();
    });
    expect(patchBooking).toHaveBeenCalledWith(
      "b1",
      expect.objectContaining({
        location: "Studio",
        notes: "n",
      }),
    );
    expect(setIsEditing).toHaveBeenCalledWith(false);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Booking updated" }),
    );
  });

  it("cancels a booking and clears selection", async () => {
    const { result } = renderHook(() => useMiAgendaPage());
    act(() => {
      result.current.setSelectedId("b1");
      result.current.setCancelModalOpen(true);
    });
    await act(async () => {
      await result.current.onConfirmCancel();
    });
    expect(result.current.cancelModalOpen).toBe(false);
    expect(patchBooking).toHaveBeenCalledWith("b1", { status: "CANCELLED" });
    expect(result.current.selectedId).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Booking canceled" }),
    );
  });
});
