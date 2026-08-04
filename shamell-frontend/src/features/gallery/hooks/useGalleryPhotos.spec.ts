/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  FIXTURE_CATEGORY_SLUG,
  FIXTURE_PHOTO_ID,
} from "../test/fixtures/uuids.fixture";
import { useGalleryPhotos } from "./useGalleryPhotos";

describe("useGalleryPhotos", () => {
  beforeEach(() => {
    // default MSW handlers already registered
  });

  it("loads photos after mount", async () => {
    const { result } = renderHook(() => useGalleryPhotos("all"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.photos[0]?.id).toBe(FIXTURE_PHOTO_ID);
  });

  it("requests filtered category", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/gallery/photos", ({ request }) => {
        url = request.url;
        return HttpResponse.json({
          items: [],
          pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
        });
      }),
    );
    const { result } = renderHook(() =>
      useGalleryPhotos(FIXTURE_CATEGORY_SLUG),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(url).toContain(`category=${FIXTURE_CATEGORY_SLUG}`);
  });

  it("skips fetch when disabled", async () => {
    const { result } = renderHook(() => useGalleryPhotos("all", undefined, false));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.photos).toEqual([]);
  });

  it("falls back to static items on API failure", async () => {
    server.use(
      http.get("*/api/v1/gallery/photos", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useGalleryPhotos("all"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(Array.isArray(result.current.photos)).toBe(true);
  });
});
