import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchGalleryCategories } from "./fetchGalleryCategories";
import { FIXTURE_CATEGORY_SLUG } from "../test/fixtures/uuids.fixture";

describe("fetchGalleryCategories", () => {
  it("loads tabs with All prepended", async () => {
    const tabs = await fetchGalleryCategories();
    expect(tabs[0]).toEqual({ id: "all", label: "All" });
    expect(tabs.some((t) => t.id === FIXTURE_CATEGORY_SLUG)).toBe(true);
  });

  it("throws on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/gallery/categories", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    await expect(fetchGalleryCategories()).rejects.toThrow(
      /Cannot load gallery categories/,
    );
  });
});
