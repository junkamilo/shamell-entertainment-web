import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminGalleryPhoto } from "./patchAdminGalleryPhoto";
import { FIXTURE_PHOTO_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminGalleryPhoto", () => {
  it("patches successfully", async () => {
    await expect(
      patchAdminGalleryPhoto("token-1", FIXTURE_PHOTO_ID, new FormData()),
    ).resolves.toBeUndefined();
  });

  it("sends FormData with bearer token to the photo id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.patch("*/api/v1/gallery/admin/photos/:id", async ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );

    const body = new FormData();
    body.append("categoryId", "cat-1");
    await patchAdminGalleryPhoto("token-1", FIXTURE_PHOTO_ID, body);

    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_PHOTO_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/gallery/admin/photos/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminGalleryPhoto("token-1", FIXTURE_PHOTO_ID, new FormData()),
    ).rejects.toThrow(/nope/);
  });
});
