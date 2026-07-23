import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteGalleryAdminPhoto } from "./deleteGalleryAdminPhoto";
import { FIXTURE_CATALOG_IMAGE_ID } from "../test/fixtures/uuids.fixture";

describe("deleteGalleryAdminPhoto", () => {
  it("resolves on success", async () => {
    await expect(
      deleteGalleryAdminPhoto("token-1", FIXTURE_CATALOG_IMAGE_ID),
    ).resolves.toBeUndefined();
  });

  it("calls DELETE with bearer token", async () => {
    let auth: string | null = null;
    let photoId = "";
    server.use(
      http.delete("*/api/v1/gallery/admin/photos/:photoId", ({ request, params }) => {
        auth = request.headers.get("Authorization");
        photoId = String(params.photoId);
        return HttpResponse.json({ ok: true });
      }),
    );

    await deleteGalleryAdminPhoto("secret-token", FIXTURE_CATALOG_IMAGE_ID);
    expect(auth).toBe("Bearer secret-token");
    expect(photoId).toBe(FIXTURE_CATALOG_IMAGE_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.delete("*/api/v1/gallery/admin/photos/:photoId", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      deleteGalleryAdminPhoto("token-1", FIXTURE_CATALOG_IMAGE_ID),
    ).rejects.toThrow(/nope/);
  });
});
