import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminGalleryPhoto } from "./deleteAdminGalleryPhoto";
import { FIXTURE_PHOTO_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAdminGalleryPhoto", () => {
  it("deletes successfully", async () => {
    await expect(
      deleteAdminGalleryPhoto("token-1", FIXTURE_PHOTO_ID),
    ).resolves.toBeUndefined();
  });

  it("sends bearer token to the photo id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.delete("*/api/v1/gallery/admin/photos/:id", ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );

    await deleteAdminGalleryPhoto("token-1", FIXTURE_PHOTO_ID);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_PHOTO_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.delete("*/api/v1/gallery/admin/photos/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      deleteAdminGalleryPhoto("token-1", FIXTURE_PHOTO_ID),
    ).rejects.toThrow(/nope/);
  });
});
