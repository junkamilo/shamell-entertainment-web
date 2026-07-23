/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const getTokenMock = vi.fn((): string | null => "token-1");
const fetchDetailMock = vi.fn(async () => ({ id: "pay-1", amount: 100 }));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchAdminPaymentDetail", () => ({
  fetchAdminPaymentDetail: (...args: unknown[]) => fetchDetailMock(...args),
}));

import { usePaymentHistoryDetail } from "./usePaymentHistoryDetail";

describe("usePaymentHistoryDetail", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
    fetchDetailMock.mockReset();
    fetchDetailMock.mockResolvedValue({ id: "pay-1", amount: 100 });
  });

  it("clears state when the modal is closed", async () => {
    const { result } = renderHook(() =>
      usePaymentHistoryDetail({ flow: "BOOKING_QUOTE", id: "pay-1" }, false),
    );
    await waitFor(() => expect(result.current.isLoadingDetail).toBe(false));
    expect(result.current.detail).toBeNull();
    expect(fetchDetailMock).not.toHaveBeenCalled();
  });

  it("loads detail when open", async () => {
    const { result } = renderHook(() =>
      usePaymentHistoryDetail({ flow: "BOOKING_QUOTE", id: "pay-1" }, true),
    );
    await waitFor(() => expect(result.current.isLoadingDetail).toBe(false));
    expect(result.current.detail).toEqual({ id: "pay-1", amount: 100 });
    expect(fetchDetailMock).toHaveBeenCalledWith("token-1", "BOOKING_QUOTE", "pay-1");
  });

  it("sets an error when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() =>
      usePaymentHistoryDetail({ flow: "BOOKING_QUOTE", id: "pay-1" }, true),
    );
    await waitFor(() => expect(result.current.detailError).toBe("Not signed in."));
    expect(fetchDetailMock).not.toHaveBeenCalled();
  });

  it("surfaces fetch errors", async () => {
    fetchDetailMock.mockRejectedValueOnce(new Error("detail boom"));
    const { result } = renderHook(() =>
      usePaymentHistoryDetail({ flow: "CLASS_ENROLLMENT", id: "pay-2" }, true),
    );
    await waitFor(() => expect(result.current.isLoadingDetail).toBe(false));
    expect(result.current.detailError).toBe("detail boom");
    expect(result.current.detail).toBeNull();
  });
});
