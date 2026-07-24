/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_OCCASION_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { makeOccasionTypesApiPayload } from "../test/fixtures/occasionTypes.fixture";
import { occasionTypesListHandler } from "../test/mocks/handlers";
import { server } from "@/test/server";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/occasionTypesAuth", () => ({
  getOccasionTypesBearerToken: () => getTokenMock(),
}));

import { useOccasionTypesList } from "./useOccasionTypesList";

describe("useOccasionTypesList", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    server.use(occasionTypesListHandler());
  });

  it("loads rows via MSW", async () => {
    const { result } = renderHook(() => useOccasionTypesList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rows[0]?.id).toBe(FIXTURE_OCCASION_TYPE_ID);
  });

  it("toasts sign-in required when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useOccasionTypesList());
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Sign-in required",
        }),
      ),
    );
    expect(result.current.rows).toEqual([]);
  });

  it("filters by search and tab", async () => {
    const { result } = renderHook(() => useOccasionTypesList());
    await waitFor(() => expect(result.current.rows.length).toBe(2));

    act(() => {
      result.current.setSearchQuery("anni");
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]?.name).toBe("Anniversary");

    act(() => {
      result.current.setSearchQuery("");
      result.current.setFilterTab("active");
    });
    expect(result.current.filtered.every((r) => r.isActive)).toBe(true);
  });
});
