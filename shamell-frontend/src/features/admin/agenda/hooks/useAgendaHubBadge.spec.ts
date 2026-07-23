/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { PETICIONES_BADGE_REFRESH_EVENT } from "@/lib/peticionesNotifications";

const getTokenMock = vi.fn((): string | null => "token-1");
const readPeticionesLastSeenMock = vi.fn(() => 0);
const readPaymentLastSeenMock = vi.fn(() => 0);
const fetchHubMock = vi.fn(async () => ({
  peticionesBadge: 4,
  paymentHistoryBadge: 2,
}));
const fetchPeticionesBadgeMock = vi.fn(async () => 1);
const fetchPaymentHistoryBadgeMock = vi.fn(async () => 5);

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("@/lib/peticionesNotifications", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/peticionesNotifications")>();
  return {
    ...actual,
    readPeticionesLastSeenAt: () => readPeticionesLastSeenMock(),
  };
});

vi.mock("@/lib/paymentHistoryNotifications", () => ({
  readPaymentHistoryLastSeenAt: () => readPaymentLastSeenMock(),
}));

vi.mock("../services/fetchAgendaHubBadges", () => ({
  fetchAgendaHubBadges: (...args: unknown[]) => fetchHubMock(...args),
}));

vi.mock("../services/fetchPeticionesBadge", () => ({
  fetchPeticionesBadge: (...args: unknown[]) => fetchPeticionesBadgeMock(...args),
}));

vi.mock("../payment-history/services/fetchAdminPayments", () => ({
  fetchPaymentHistoryBadge: (...args: unknown[]) => fetchPaymentHistoryBadgeMock(...args),
}));

import { useAgendaHubBadge } from "./useAgendaHubBadge";

describe("useAgendaHubBadge", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
    readPeticionesLastSeenMock.mockReturnValue(0);
    readPaymentLastSeenMock.mockReturnValue(0);
    fetchHubMock.mockReset();
    fetchHubMock.mockResolvedValue({
      peticionesBadge: 4,
      paymentHistoryBadge: 2,
    });
    fetchPeticionesBadgeMock.mockReset();
    fetchPeticionesBadgeMock.mockResolvedValue(1);
    fetchPaymentHistoryBadgeMock.mockReset();
    fetchPaymentHistoryBadgeMock.mockResolvedValue(5);
  });

  it("returns zeros when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useAgendaHubBadge());
    await waitFor(() => {
      expect(result.current).toEqual({ peticionesBadge: 0, paymentHistoryBadge: 0 });
    });
    expect(fetchHubMock).not.toHaveBeenCalled();
  });

  it("loads composite hub badges", async () => {
    const { result } = renderHook(() => useAgendaHubBadge());
    await waitFor(() => expect(result.current.peticionesBadge).toBe(4));
    expect(result.current.paymentHistoryBadge).toBe(2);
    expect(fetchHubMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        peticionesBookingsSince: undefined,
        paymentsSince: undefined,
      }),
    );
  });

  it("falls back to per-lane fetches when the composite call fails", async () => {
    fetchHubMock.mockRejectedValueOnce(new Error("hub down"));
    fetchPeticionesBadgeMock
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4);
    fetchPaymentHistoryBadgeMock.mockResolvedValueOnce(9);

    const { result } = renderHook(() => useAgendaHubBadge());
    await waitFor(() => expect(result.current.peticionesBadge).toBe(9));
    expect(result.current.paymentHistoryBadge).toBe(9);
    expect(fetchPeticionesBadgeMock).toHaveBeenCalledTimes(3);
  });

  it("resets to zeros when fallback also fails", async () => {
    fetchHubMock.mockRejectedValueOnce(new Error("hub down"));
    fetchPeticionesBadgeMock.mockRejectedValue(new Error("lane fail"));
    fetchPaymentHistoryBadgeMock.mockRejectedValue(new Error("pay fail"));

    const { result } = renderHook(() => useAgendaHubBadge());
    await waitFor(() => {
      expect(result.current).toEqual({ peticionesBadge: 0, paymentHistoryBadge: 0 });
    });
  });

  it("reloads on the peticiones badge refresh event", async () => {
    const { result } = renderHook(() => useAgendaHubBadge());
    await waitFor(() => expect(result.current.peticionesBadge).toBe(4));
    fetchHubMock.mockResolvedValueOnce({
      peticionesBadge: 11,
      paymentHistoryBadge: 1,
    });
    await act(async () => {
      window.dispatchEvent(new Event(PETICIONES_BADGE_REFRESH_EVENT));
    });
    await waitFor(() => expect(result.current.peticionesBadge).toBe(11));
  });
});
