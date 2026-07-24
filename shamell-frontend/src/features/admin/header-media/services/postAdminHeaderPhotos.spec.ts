import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminHeaderPhotos } from "./postAdminHeaderPhotos";

describe("postAdminHeaderPhotos", () => {
  it("uploads successfully", async () => {
    await expect(
      postAdminHeaderPhotos("token-1", [
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ]),
    ).resolves.toBeUndefined();
  });

  it("sends FormData images with bearer token", async () => {
    let auth: string | null = null;
    let imageCount = 0;
    server.use(
      http.post("*/api/v1/header-media/admin/photos", async ({ request }) => {
        auth = request.headers.get("Authorization");
        const form = await request.formData();
        imageCount = form.getAll("images").length;
        return HttpResponse.json({ ok: true });
      }),
    );

    await postAdminHeaderPhotos("token-1", [
      new File(["a"], "a.jpg", { type: "image/jpeg" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
    ]);
    expect(auth).toBe("Bearer token-1");
    expect(imageCount).toBe(2);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/header-media/admin/photos", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(postAdminHeaderPhotos("token-1", [])).rejects.toThrow(/nope/);
  });
});
