import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminGalleryCategory } from "./patchAdminGalleryCategory";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminGalleryCategory", () => {
  it("patches successfully", async () => {
    await expect(
      patchAdminGalleryCategory("token-1", FIXTURE_CATEGORY_ID, "Weddings"),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token to the category id", async () => {
    let auth: string | null = null;
    let url = "";
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/gallery/admin/categories/:id", async ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    await patchAdminGalleryCategory("token-1", FIXTURE_CATEGORY_ID, "Updated");
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_CATEGORY_ID);
    expect(received).toEqual({ name: "Updated" });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/gallery/admin/categories/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminGalleryCategory("token-1", FIXTURE_CATEGORY_ID, "Weddings"),
    ).rejects.toThrow(/nope/);
  });
});
