import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminGalleryCategoryActive } from "./patchAdminGalleryCategoryActive";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminGalleryCategoryActive", () => {
  it("patches isActive successfully", async () => {
    await expect(
      patchAdminGalleryCategoryActive("token-1", FIXTURE_CATEGORY_ID, false),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/gallery/admin/categories/:id", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    await patchAdminGalleryCategoryActive("token-1", FIXTURE_CATEGORY_ID, true);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual({ isActive: true });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/gallery/admin/categories/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminGalleryCategoryActive("token-1", FIXTURE_CATEGORY_ID, false),
    ).rejects.toThrow(/nope/);
  });
});
