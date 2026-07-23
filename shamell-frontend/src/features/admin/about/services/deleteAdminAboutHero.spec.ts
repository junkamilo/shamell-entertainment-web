import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminAboutHero } from "./deleteAdminAboutHero";

describe("deleteAdminAboutHero", () => {
  it("calls DELETE with bearer token and returns json", async () => {
    let auth: string | null = null;
    server.use(
      http.delete("*/api/v1/about/admin/media", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    const result = await deleteAdminAboutHero("secret-token");
    expect(auth).toBe("Bearer secret-token");
    expect(result.response.ok).toBe(true);
    expect(result.data).toEqual({ ok: true });
  });

  it("propagates error body when delete fails", async () => {
    server.use(
      http.delete("*/api/v1/about/admin/media", () =>
        HttpResponse.json({ message: "Cloudinary down" }, { status: 502 }),
      ),
    );

    const result = await deleteAdminAboutHero("token-1");
    expect(result.response.status).toBe(502);
    expect(result.data).toEqual({ message: "Cloudinary down" });
  });
});
