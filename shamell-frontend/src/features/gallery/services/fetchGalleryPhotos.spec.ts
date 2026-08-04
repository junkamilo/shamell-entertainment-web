import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchGalleryPhotos } from "./fetchGalleryPhotos";
import {
  FIXTURE_CATEGORY_SLUG,
  FIXTURE_PHOTO_ID,
} from "../test/fixtures/uuids.fixture";
import { makeGalleryPhotosApiPayload } from "../test/fixtures/gallery.fixture";

describe("fetchGalleryPhotos", () => {
  it("loads mapped photos", async () => {
    const photos = await fetchGalleryPhotos({ filter: "all" });
    expect(photos[0]?.id).toBe(FIXTURE_PHOTO_ID);
    expect(photos[0]?.alt).toContain("gallery");
  });

  it("sends category, limit, and page query params", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/gallery/photos", ({ request }) => {
        url = request.url;
        return HttpResponse.json(makeGalleryPhotosApiPayload([]));
      }),
    );

    await fetchGalleryPhotos({
      filter: FIXTURE_CATEGORY_SLUG,
      limit: 12,
      page: 2,
    });

    expect(url).toContain(`category=${FIXTURE_CATEGORY_SLUG}`);
    expect(url).toContain("limit=12");
    expect(url).toContain("page=2");
  });

  it("omits category when filter is all", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/gallery/photos", ({ request }) => {
        url = request.url;
        return HttpResponse.json(makeGalleryPhotosApiPayload([]));
      }),
    );
    await fetchGalleryPhotos({ filter: "all" });
    expect(url).not.toContain("category=");
    expect(url).toContain("page=1");
  });

  it("throws on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/gallery/photos", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchGalleryPhotos({ filter: "all" })).rejects.toThrow(
      /Cannot load gallery photos/,
    );
  });
});
