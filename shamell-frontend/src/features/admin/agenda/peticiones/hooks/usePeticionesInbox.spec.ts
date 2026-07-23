/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";

const getTokenMock = vi.fn((): string | null => "token-1");
const fetchInboxMock = vi.fn(async () => ({
  items: [{ id: "row-1" }],
  meta: { ...DEFAULT_PAGINATION_META, totalItems: 1 },
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchAdminPeticiones", () => ({
  fetchAdminPeticiones: (...args: unknown[]) => fetchInboxMock(...args),
}));

import { usePeticionesInbox } from "./usePeticionesInbox";

describe("usePeticionesInbox", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
    fetchInboxMock.mockReset();
    fetchInboxMock.mockResolvedValue({
      items: [{ id: "row-1" }],
      meta: { ...DEFAULT_PAGINATION_META, totalItems: 1 },
    });
  });

  it("skips fetch when disabled", async () => {
    const { result } = renderHook(() => usePeticionesInbox(false));
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(fetchInboxMock).not.toHaveBeenCalled();
  });

  it("clears when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => usePeticionesInbox(true, { lane: "bookings" }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rows).toEqual([]);
    expect(fetchInboxMock).not.toHaveBeenCalled();
  });

  it("loads inbox rows for a lane", async () => {
    const { result } = renderHook(() =>
      usePeticionesInbox(true, { lane: "private_classes", page: 2, perPage: 10 }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rows).toEqual([{ id: "row-1" }]);
    expect(fetchInboxMock).toHaveBeenCalledWith("token-1", {
      page: 2,
      perPage: 10,
      lane: "private_classes",
    });
  });

  it("sets an error message when fetch fails", async () => {
    fetchInboxMock.mockRejectedValueOnce(new Error("inbox boom"));
    const { result } = renderHook(() => usePeticionesInbox(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("inbox boom");
  });

  it("reload re-fetches", async () => {
    const { result } = renderHook(() => usePeticionesInbox(true, { lane: "bookings" }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fetchInboxMock.mockResolvedValueOnce({
      items: [{ id: "row-2" }],
      meta: { ...DEFAULT_PAGINATION_META, totalItems: 2 },
    });
    await act(async () => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.rows).toEqual([{ id: "row-2" }]));
  });
});
