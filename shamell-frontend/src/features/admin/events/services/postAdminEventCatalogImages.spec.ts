import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminEventCatalogImages } from "./postAdminEventCatalogImages";
import { FIXTURE_EVENT_ID } from "../test/fixtures/uuids.fixture";

describe("postAdminEventCatalogImages", () => {
  it("uploads media files as FormData", async () => {
    let auth: string | null = null;
    let received: FormData | null = null;
    server.use(
      http.post("*/api/v1/events/admin/:eventId/images", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.formData();
        return HttpResponse.json({ ok: true });
      }),
    );

    const file = new File(["bytes"], "event.jpg", { type: "image/jpeg" });
    await expect(
      postAdminEventCatalogImages("token-1", FIXTURE_EVENT_ID, [file]),
    ).resolves.toBeUndefined();

    expect(auth).toBe("Bearer token-1");
    expect(received).not.toBeNull();
    const media = received!.getAll("media");
    expect(media).toHaveLength(1);
    expect(media[0]).toBeInstanceOf(File);
    expect((media[0] as File).name).toBe("event.jpg");
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/events/admin/:eventId/images", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      postAdminEventCatalogImages("token-1", FIXTURE_EVENT_ID, [
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ]),
    ).rejects.toThrow(/nope/);
  });
});
