/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";

const markSeenMock = vi.fn();
const confirmRemoveContact = vi.fn(async () => undefined);
const confirmRemoveBooking = vi.fn(async () => undefined);

vi.mock("@/lib/peticionesNotifications", () => ({
  markPeticionesLaneSeenNow: (...args: unknown[]) => markSeenMock(...args),
}));

vi.mock("@/hooks/use-admin-contact-requests", () => ({
  useAdminContactRequests: () => ({
    remove: vi.fn(),
    setStatus: vi.fn(),
    reload: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-admin-bookings", () => ({
  useAdminBookings: () => ({
    createBooking: vi.fn(),
    patchBooking: vi.fn(),
    removeBooking: vi.fn(),
    reload: vi.fn(),
    createBookingQuote: vi.fn(),
    sendBalanceLink: vi.fn(),
  }),
}));

vi.mock("../../hooks/usePeticionesLaneBadge", () => ({
  usePeticionesLaneBadge: () => 2,
}));

vi.mock("./usePeticionesCatalogMaps", () => ({
  usePeticionesCatalogMaps: () => ({
    serviceByInquiryCode: new Map(),
    eventTypeContactCodeById: new Map(),
    inquiryCodeByCatalogLineId: new Map(),
  }),
}));

vi.mock("./usePeticionesInbox", () => ({
  usePeticionesInbox: () => ({
    rows: [
      { origin: "CONTACT", state: "PENDING", id: "c1" },
      { origin: "BOOKING_ADMIN", status: "CONFIRMED", id: "b1" },
    ],
    meta: { ...DEFAULT_PAGINATION_META, totalPages: 1 },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock("./usePeticionesActions", () => ({
  usePeticionesActions: () => ({
    confirmRemoveContact,
    confirmRemoveBooking,
  }),
}));

import { usePeticionesPage } from "./usePeticionesPage";

describe("usePeticionesPage", () => {
  beforeEach(() => {
    markSeenMock.mockClear();
    confirmRemoveContact.mockClear();
    confirmRemoveBooking.mockClear();
  });

  it("marks bookings lane seen on mount", () => {
    renderHook(() => usePeticionesPage());
    expect(markSeenMock).toHaveBeenCalledWith("bookings");
  });

  it("resets page and expands when the lane changes", () => {
    const { result } = renderHook(() => usePeticionesPage());
    act(() => {
      result.current.setPage(3);
      result.current.setExpandedId("row-1");
    });
    act(() => {
      result.current.onLaneChange("guidance");
    });
    expect(result.current.activeLane).toBe("guidance");
    expect(result.current.page).toBe(1);
    expect(result.current.expandedId).toBeNull();
    expect(markSeenMock).toHaveBeenCalledWith("guidance");
  });

  it("counts pending inbox rows", () => {
    const { result } = renderHook(() => usePeticionesPage());
    expect(result.current.pendingCount).toBe(1);
  });

  it("routes confirm delete to contact or booking actions", async () => {
    const { result } = renderHook(() => usePeticionesPage());
    act(() => {
      result.current.setConfirmDelete({
        kind: "CONTACT",
        id: "c1",
        title: "Delete",
        description: "x",
      });
    });
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(confirmRemoveContact).toHaveBeenCalledWith("c1");

    act(() => {
      result.current.setConfirmDelete({
        kind: "BOOKING",
        id: "b1",
        title: "Delete",
        description: "x",
      });
    });
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(confirmRemoveBooking).toHaveBeenCalledWith("b1", undefined, true);
  });
});
