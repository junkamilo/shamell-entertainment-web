import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminHeaderPhoto } from "./deleteAdminHeaderPhoto";
import { FIXTURE_HEADER_PHOTO_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAdminHeaderPhoto", () => {
  it("deletes successfully", async () => {
    await expect(
      deleteAdminHeaderPhoto("token-1", FIXTURE_HEADER_PHOTO_ID),
    ).resolves.toBeUndefined();
  });

  it("sends bearer token to the photo id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.delete("*/api/v1/header-media/admin/photos/:id", ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );
    await deleteAdminHeaderPhoto("token-1", FIXTURE_HEADER_PHOTO_ID);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_HEADER_PHOTO_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.delete("*/api/v1/header-media/admin/photos/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      deleteAdminHeaderPhoto("token-1", FIXTURE_HEADER_PHOTO_ID),
    ).rejects.toThrow(/nope/);
  });
});
