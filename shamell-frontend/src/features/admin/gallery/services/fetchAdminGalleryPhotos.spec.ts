import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminGalleryPhotos } from "./fetchAdminGalleryPhotos";
import { FIXTURE_PHOTO_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminGalleryPhotos", () => {
  it("loads the photos list", async () => {
    const result = await fetchAdminGalleryPhotos("token-1");
    expect(result[0]?.id).toBe(FIXTURE_PHOTO_ID);
    expect(result.length).toBeGreaterThan(0);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get("*/api/v1/gallery/admin/photos", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json([]);
      }),
    );
    await fetchAdminGalleryPhotos("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.get("*/api/v1/gallery/admin/photos", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminGalleryPhotos("token-1")).rejects.toThrow(/nope/);
  });
});
