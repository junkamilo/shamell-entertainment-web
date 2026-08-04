/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { FIXTURE_CATEGORY_SLUG } from "../test/fixtures/uuids.fixture";
import { useGalleryCategories } from "./useGalleryCategories";

describe("useGalleryCategories", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads categories after mount", async () => {
    const { result } = renderHook(() => useGalleryCategories());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories[0]).toEqual({ id: "all", label: "All" });
    expect(
      result.current.categories.some((c) => c.id === FIXTURE_CATEGORY_SLUG),
    ).toBe(true);
  });

  it("skips fetch when disabled", async () => {
    const { result } = renderHook(() => useGalleryCategories(false));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toEqual([]);
  });

  it("falls back to static tabs on API failure", async () => {
    server.use(
      http.get("*/api/v1/gallery/categories", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useGalleryCategories());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories.length).toBeGreaterThan(0);
    expect(result.current.categories[0]?.id).toBe("all");
  });
});
