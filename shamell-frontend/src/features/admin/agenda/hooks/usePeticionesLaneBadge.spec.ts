/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { PETICIONES_BADGE_REFRESH_EVENT } from "@/lib/peticionesNotifications";

const getTokenMock = vi.fn((): string | null => "token-1");
const readLastSeenMock = vi.fn((_lane?: string) => 0);
const fetchBadgeMock = vi.fn(async () => 3);

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("@/lib/peticionesNotifications", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/peticionesNotifications")>();
  return {
    ...actual,
    readPeticionesLastSeenAt: (...args: unknown[]) => readLastSeenMock(...args),
  };
});

vi.mock("../services/fetchPeticionesBadge", () => ({
  fetchPeticionesBadge: (...args: unknown[]) => fetchBadgeMock(...args),
}));

import { usePeticionesLaneBadge } from "./usePeticionesLaneBadge";

describe("usePeticionesLaneBadge", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
    readLastSeenMock.mockReturnValue(0);
    fetchBadgeMock.mockReset();
    fetchBadgeMock.mockResolvedValue(3);
  });

  it("returns 0 when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => usePeticionesLaneBadge("bookings"));
    await waitFor(() => expect(result.current).toBe(0));
    expect(fetchBadgeMock).not.toHaveBeenCalled();
  });

  it("returns 0 when disabled", async () => {
    const { result } = renderHook(() => usePeticionesLaneBadge("bookings", false));
    await waitFor(() => expect(result.current).toBe(0));
    expect(fetchBadgeMock).not.toHaveBeenCalled();
  });

  it("loads the badge count for the lane", async () => {
    readLastSeenMock.mockReturnValue(1_700_000_000_000);
    const { result } = renderHook(() => usePeticionesLaneBadge("private_classes"));
    await waitFor(() => expect(result.current).toBe(3));
    expect(fetchBadgeMock).toHaveBeenCalledWith("token-1", {
      lane: "private_classes",
      since: 1_700_000_000_000,
    });
  });

  it("omits since when lastSeen is 0", async () => {
    readLastSeenMock.mockReturnValue(0);
    renderHook(() => usePeticionesLaneBadge("guidance"));
    await waitFor(() => expect(fetchBadgeMock).toHaveBeenCalled());
    expect(fetchBadgeMock).toHaveBeenCalledWith("token-1", {
      lane: "guidance",
      since: undefined,
    });
  });

  it("resets to 0 when the fetch fails", async () => {
    fetchBadgeMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => usePeticionesLaneBadge("bookings"));
    await waitFor(() => expect(result.current).toBe(0));
  });

  it("reloads on the peticiones badge refresh event", async () => {
    const { result } = renderHook(() => usePeticionesLaneBadge("bookings"));
    await waitFor(() => expect(result.current).toBe(3));
    fetchBadgeMock.mockResolvedValueOnce(7);
    await act(async () => {
      window.dispatchEvent(new Event(PETICIONES_BADGE_REFRESH_EVENT));
    });
    await waitFor(() => expect(result.current).toBe(7));
  });
});
