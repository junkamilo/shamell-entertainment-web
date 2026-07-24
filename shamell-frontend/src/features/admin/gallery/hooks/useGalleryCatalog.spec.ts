/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_PHOTO_ID,
} from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/galleryAuth", () => ({
  getGalleryBearerToken: () => getTokenMock(),
}));

import { useGalleryCatalog } from "./useGalleryCatalog";

describe("useGalleryCatalog", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads categories and photos via MSW", async () => {
    const { result } = renderHook(() => useGalleryCatalog());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.photos.length).toBeGreaterThan(0);
    expect(result.current.photos[0]?.id).toBe(FIXTURE_PHOTO_ID);
    expect(result.current.categories.length).toBeGreaterThan(0);
    expect(result.current.categories[0]?.id).toBe(FIXTURE_CATEGORY_ID);
  });

  it("toasts sign-in required when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useGalleryCatalog());

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Sign-in required",
        }),
      ),
    );
    expect(result.current.photos).toEqual([]);
    expect(result.current.categories).toEqual([]);
  });
});
