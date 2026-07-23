/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const getTokenMock = vi.fn((): string | null => "token-1");
const fetchWebhooksMock = vi.fn(async () => ({
  items: [{ id: "evt-1" }],
  meta: {
    page: 1,
    perPage: 20,
    totalItems: 1,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  },
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchAdminStripeWebhooks", () => ({
  fetchAdminStripeWebhooks: (...args: unknown[]) => fetchWebhooksMock(...args),
}));

import { useStripeWebhooksPage } from "./useStripeWebhooksPage";

describe("useStripeWebhooksPage", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
    fetchWebhooksMock.mockReset();
    fetchWebhooksMock.mockResolvedValue({
      items: [{ id: "evt-1" }],
      meta: {
        page: 1,
        perPage: 20,
        totalItems: 1,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      },
    });
  });

  it("errors when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useStripeWebhooksPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Not signed in.");
  });

  it("loads webhook events", async () => {
    const { result } = renderHook(() => useStripeWebhooksPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([{ id: "evt-1" }]);
  });

  it("forces FAILED status when failedOnly is on", async () => {
    const { result } = renderHook(() => useStripeWebhooksPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      result.current.setFailedOnly(true);
    });
    await waitFor(() =>
      expect(fetchWebhooksMock).toHaveBeenCalledWith(
        "token-1",
        expect.objectContaining({ status: "FAILED" }),
      ),
    );
  });

  it("resets page to 1 when perPage changes", async () => {
    const { result } = renderHook(() => useStripeWebhooksPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      result.current.setPage(2);
    });
    await act(async () => {
      result.current.setPerPage(50);
    });
    expect(result.current.page).toBe(1);
    expect(result.current.perPage).toBe(50);
  });
});
