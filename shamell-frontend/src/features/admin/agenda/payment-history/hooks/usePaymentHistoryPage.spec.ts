/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const getTokenMock = vi.fn((): string | null => "token-1");
const markSeenMock = vi.fn();
const fetchPaymentsMock = vi.fn(async () => ({
  items: [{ id: "pay-1" }],
  meta: {
    page: 1,
    limit: 20,
    totalItems: 1,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  },
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("@/lib/paymentHistoryNotifications", () => ({
  markPaymentHistorySeenNow: () => markSeenMock(),
}));

vi.mock("../services/fetchAdminPayments", () => ({
  fetchAdminPayments: (...args: unknown[]) => fetchPaymentsMock(...args),
}));

import { usePaymentHistoryPage } from "./usePaymentHistoryPage";

describe("usePaymentHistoryPage", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
    markSeenMock.mockClear();
    fetchPaymentsMock.mockReset();
    fetchPaymentsMock.mockResolvedValue({
      items: [{ id: "pay-1" }],
      meta: {
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      },
    });
  });

  it("marks history as seen on mount", async () => {
    renderHook(() => usePaymentHistoryPage());
    await waitFor(() => expect(markSeenMock).toHaveBeenCalled());
  });

  it("errors when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => usePaymentHistoryPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Not signed in.");
  });

  it("loads payments", async () => {
    const { result } = renderHook(() => usePaymentHistoryPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([{ id: "pay-1" }]);
    expect(fetchPaymentsMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it("resets page to 1 when perPage changes", async () => {
    const { result } = renderHook(() => usePaymentHistoryPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      result.current.setPage(3);
    });
    await act(async () => {
      result.current.setPerPage(50);
    });
    expect(result.current.page).toBe(1);
    expect(result.current.perPage).toBe(50);
  });

  it("surfaces fetch errors", async () => {
    fetchPaymentsMock.mockRejectedValueOnce(new Error("pay fail"));
    const { result } = renderHook(() => usePaymentHistoryPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("pay fail");
    expect(result.current.items).toEqual([]);
  });
});
