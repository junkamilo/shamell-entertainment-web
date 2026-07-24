import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminGalleryPhotos } from "./postAdminGalleryPhotos";
import { FIXTURE_PHOTO_ID } from "../test/fixtures/uuids.fixture";

describe("postAdminGalleryPhotos", () => {
  it("returns created items on success", async () => {
    const body = new FormData();
    body.append("categoryId", "cat-1");
    body.append("media", new File(["x"], "a.jpg", { type: "image/jpeg" }));

    const result = await postAdminGalleryPhotos("token-1", body);
    expect(result.items[0]).toMatchObject({ id: FIXTURE_PHOTO_ID });
  });

  it("sends FormData with bearer token", async () => {
    let auth: string | null = null;
    let categoryId: FormDataEntryValue | null = null;
    server.use(
      http.post("*/api/v1/gallery/admin/photos", async ({ request }) => {
        auth = request.headers.get("Authorization");
        const form = await request.formData();
        categoryId = form.get("categoryId");
        return HttpResponse.json({ items: [{ id: FIXTURE_PHOTO_ID }] });
      }),
    );

    const body = new FormData();
    body.append("categoryId", "cat-1");
    body.append("media", new File(["x"], "a.jpg", { type: "image/jpeg" }));
    await postAdminGalleryPhotos("token-1", body);

    expect(auth).toBe("Bearer token-1");
    expect(categoryId).toBe("cat-1");
  });

  it("returns empty items when payload items is missing", async () => {
    server.use(
      http.post("*/api/v1/gallery/admin/photos", () =>
        HttpResponse.json({ ok: true }),
      ),
    );
    const body = new FormData();
    const result = await postAdminGalleryPhotos("token-1", body);
    expect(result.items).toEqual([]);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/gallery/admin/photos", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      postAdminGalleryPhotos("token-1", new FormData()),
    ).rejects.toThrow(/nope/);
  });
});
