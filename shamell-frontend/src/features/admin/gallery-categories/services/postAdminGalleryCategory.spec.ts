import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminGalleryCategory } from "./postAdminGalleryCategory";

describe("postAdminGalleryCategory", () => {
  it("creates successfully", async () => {
    await expect(postAdminGalleryCategory("token-1", "Weddings")).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.post("*/api/v1/gallery/admin/categories", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    await postAdminGalleryCategory("token-1", "Weddings");
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual({ name: "Weddings" });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(postAdminGalleryCategory("token-1", "Weddings")).rejects.toThrow(/nope/);
  });
});
