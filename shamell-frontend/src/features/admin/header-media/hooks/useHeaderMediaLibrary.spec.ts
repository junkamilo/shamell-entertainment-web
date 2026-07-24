/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_HEADER_PHOTO_ID } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/headerMediaAuth", () => ({
  getHeaderMediaBearerToken: () => getTokenMock(),
}));

import { useHeaderMediaLibrary } from "./useHeaderMediaLibrary";

describe("useHeaderMediaLibrary", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads photos via MSW", async () => {
    const { result } = renderHook(() => useHeaderMediaLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.photos[0]?.id).toBe(FIXTURE_HEADER_PHOTO_ID);
    expect(result.current.paginationMeta.totalItems).toBeGreaterThan(0);
  });

  it("does not load when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useHeaderMediaLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.photos).toEqual([]);
  });

  it("paginates and resets page on perPage change", async () => {
    const { result } = renderHook(() => useHeaderMediaLibrary());
    await waitFor(() => expect(result.current.photos.length).toBeGreaterThan(0));

    act(() => {
      result.current.onPerPageChange(1);
    });
    expect(result.current.perPage).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.pagedPhotos).toHaveLength(1);

    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);
    expect(result.current.pagedPhotos[0]?.id).not.toBe(result.current.photos[0]?.id);
  });
});
