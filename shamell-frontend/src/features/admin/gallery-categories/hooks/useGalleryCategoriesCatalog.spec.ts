/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeGalleryCategoriesApiPayload,
  makeGalleryCategoryPreviewsApiPayload,
} from "../test/fixtures/galleryCategories.fixture";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/features/admin/gallery/lib/galleryAuth", () => ({
  getGalleryBearerToken: () => getTokenMock(),
}));

import { useGalleryCategoriesCatalog } from "./useGalleryCategoriesCatalog";

describe("useGalleryCategoriesCatalog", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.get("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json(makeGalleryCategoriesApiPayload()),
      ),
      http.get("*/api/v1/gallery/admin/photos", () =>
        HttpResponse.json(makeGalleryCategoryPreviewsApiPayload()),
      ),
    );
  });

  it("loads categories and photos via MSW", async () => {
    const { result } = renderHook(() => useGalleryCategoriesCatalog());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories[0]?.id).toBe(FIXTURE_CATEGORY_ID);
    expect(result.current.photos.length).toBeGreaterThan(0);
  });

  it("toasts sign-in required when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useGalleryCategoriesCatalog());

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Sign-in required",
        }),
      ),
    );
    expect(result.current.categories).toEqual([]);
    expect(result.current.photos).toEqual([]);
  });
});
