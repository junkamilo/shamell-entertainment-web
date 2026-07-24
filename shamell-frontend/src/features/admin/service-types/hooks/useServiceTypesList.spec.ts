/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { serviceTypesListHandler } from "../test/mocks/handlers";
import { server } from "@/test/server";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/serviceTypesAuth", () => ({
  getServiceTypesBearerToken: () => getTokenMock(),
}));

import { useServiceTypesList } from "./useServiceTypesList";

describe("useServiceTypesList", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    server.use(serviceTypesListHandler());
  });

  it("loads types via MSW", async () => {
    const { result } = renderHook(() => useServiceTypesList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.types[0]?.id).toBe(FIXTURE_SERVICE_TYPE_ID);
  });

  it("toasts sign-in required when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useServiceTypesList());
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Sign-in required",
        }),
      ),
    );
    expect(result.current.types).toEqual([]);
  });

  it("filters by search and tab", async () => {
    const { result } = renderHook(() => useServiceTypesList());
    await waitFor(() => expect(result.current.types.length).toBe(2));

    act(() => {
      result.current.setSearchQuery("priv");
    });
    expect(result.current.filteredTypes).toHaveLength(1);
    expect(result.current.filteredTypes[0]?.name).toBe("Private class");

    act(() => {
      result.current.setSearchQuery("");
      result.current.setFilterTab("active");
    });
    expect(result.current.filteredTypes.every((r) => r.isActive)).toBe(true);
  });
});
