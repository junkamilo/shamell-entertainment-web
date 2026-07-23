/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  makeEventTypeItem,
  makeEventTypesApiPayload,
} from "../test/fixtures/eventTypes.fixture";
import { FIXTURE_EVENT_TYPE_ID_2 } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const fetchAdminEventTypesMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/eventTypesAuth", () => ({
  getEventTypesBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchAdminEventTypes", () => ({
  fetchAdminEventTypes: (...args: unknown[]) => fetchAdminEventTypesMock(...args),
}));

import { useEventTypesList } from "./useEventTypesList";

const fixtureTypes = makeEventTypesApiPayload([
  makeEventTypeItem({ name: "Private weddings", isActive: true }),
  makeEventTypeItem({
    id: FIXTURE_EVENT_TYPE_ID_2,
    name: "Corporate gala",
    isActive: false,
    occasionAssignments: [],
  }),
  makeEventTypeItem({
    id: "e3333333-3333-4333-8333-333333333333",
    name: "Birthday bash",
    isActive: true,
    occasionAssignments: [],
  }),
]);

describe("useEventTypesList", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    fetchAdminEventTypesMock.mockReset();
    fetchAdminEventTypesMock.mockResolvedValue(fixtureTypes);
  });

  it("loads types and exposes stats", async () => {
    const { result } = renderHook(() => useEventTypesList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchAdminEventTypesMock).toHaveBeenCalledWith("token-1");
    expect(result.current.types).toHaveLength(3);
    expect(result.current.stats).toEqual({ total: 3, active: 2, inactive: 1 });
  });

  it("filters by searchQuery against name", async () => {
    const { result } = renderHook(() => useEventTypesList());
    await waitFor(() => expect(result.current.types).toHaveLength(3));

    act(() => {
      result.current.setSearchQuery("corporate");
    });

    expect(result.current.filteredTypes).toHaveLength(1);
    expect(result.current.filteredTypes[0]?.id).toBe(FIXTURE_EVENT_TYPE_ID_2);
    expect(result.current.page).toBe(1);
  });

  it("filters by active and inactive tabs", async () => {
    const { result } = renderHook(() => useEventTypesList());
    await waitFor(() => expect(result.current.types).toHaveLength(3));

    act(() => {
      result.current.setFilterTab("active");
    });
    expect(result.current.filteredTypes).toHaveLength(2);
    expect(result.current.filteredTypes.every((t) => t.isActive)).toBe(true);

    act(() => {
      result.current.setFilterTab("inactive");
    });
    expect(result.current.filteredTypes).toHaveLength(1);
    expect(result.current.filteredTypes[0]?.isActive).toBe(false);
  });

  it("paginates filtered types when perPage is reduced", async () => {
    const { result } = renderHook(() => useEventTypesList());
    await waitFor(() => expect(result.current.types).toHaveLength(3));

    act(() => {
      result.current.onPerPageChange(1);
    });

    expect(result.current.perPage).toBe(1);
    expect(result.current.paginationMeta).toEqual(
      expect.objectContaining({
        page: 1,
        perPage: 1,
        totalItems: 3,
        totalPages: 3,
        hasPrev: false,
        hasNext: true,
      }),
    );
    expect(result.current.pagedTypes).toHaveLength(1);

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.paginationMeta.page).toBe(2);
    expect(result.current.paginationMeta.hasPrev).toBe(true);
    expect(result.current.paginationMeta.hasNext).toBe(true);
    expect(result.current.pagedTypes).toHaveLength(1);
    expect(result.current.pagedTypes[0]?.name).toBe("Corporate gala");
  });

  it("toasts sign-in required when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useEventTypesList());

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Sign-in required",
        }),
      ),
    );
    expect(result.current.types).toEqual([]);
    expect(fetchAdminEventTypesMock).not.toHaveBeenCalled();
  });
});
