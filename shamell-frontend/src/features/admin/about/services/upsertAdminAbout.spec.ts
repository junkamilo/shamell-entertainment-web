import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { upsertAdminAbout } from "./upsertAdminAbout";

describe("upsertAdminAbout", () => {
  it("sends title, paragraph, and coreValues in FormData", async () => {
    let received: FormData | null = null;
    server.use(
      http.patch("*/api/v1/about/admin", async ({ request }) => {
        received = await request.formData();
        return HttpResponse.json({ ok: true });
      }),
    );

    await upsertAdminAbout("token-1", {
      title: "TITLE",
      paragraph1: "Body",
      coreValues: ["A", "B"],
    });

    expect(received).not.toBeNull();
    expect(received!.get("title")).toBe("TITLE");
    expect(received!.get("paragraph1")).toBe("Body");
    expect(received!.getAll("coreValues")).toEqual(["A", "B"]);
    expect(received!.get("media")).toBeNull();
  });

  it("appends media file when provided", async () => {
    let received: FormData | null = null;
    server.use(
      http.patch("*/api/v1/about/admin", async ({ request }) => {
        received = await request.formData();
        return HttpResponse.json({ ok: true });
      }),
    );

    const file = new File(["bytes"], "hero.jpg", { type: "image/jpeg" });
    await upsertAdminAbout("token-1", {
      title: "TITLE",
      paragraph1: "Body",
      coreValues: ["A"],
      mediaFile: file,
    });

    const media = received!.get("media");
    expect(media).toBeInstanceOf(File);
    expect((media as File).name).toBe("hero.jpg");
  });
});
