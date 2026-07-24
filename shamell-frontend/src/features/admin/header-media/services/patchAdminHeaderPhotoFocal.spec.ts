import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminHeaderPhotoFocal } from "./patchAdminHeaderPhotoFocal";
import { FIXTURE_HEADER_PHOTO_ID } from "../test/fixtures/uuids.fixture";

const body = {
  focalX: 40,
  focalY: 30,
  focalMobileX: 45,
  focalMobileY: 25,
};

describe("patchAdminHeaderPhotoFocal", () => {
  it("patches focal successfully", async () => {
    await expect(
      patchAdminHeaderPhotoFocal("token-1", FIXTURE_HEADER_PHOTO_ID, body),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token to focal endpoint", async () => {
    let auth: string | null = null;
    let url = "";
    let received: unknown = null;
    server.use(
      http.patch(
        "*/api/v1/header-media/admin/photos/:id/focal",
        async ({ request }) => {
          auth = request.headers.get("Authorization");
          url = request.url;
          received = await request.json();
          return HttpResponse.json({ ok: true });
        },
      ),
    );
    await patchAdminHeaderPhotoFocal("token-1", FIXTURE_HEADER_PHOTO_ID, body);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain("/focal");
    expect(received).toEqual(body);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/header-media/admin/photos/:id/focal", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminHeaderPhotoFocal("token-1", FIXTURE_HEADER_PHOTO_ID, body),
    ).rejects.toThrow(/nope/);
  });
});
