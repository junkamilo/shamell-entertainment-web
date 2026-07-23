import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminAbout } from "./fetchAdminAbout";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";

describe("fetchAdminAbout", () => {
  it("returns normalized record on success", async () => {
    const result = await fetchAdminAbout("token-1");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.record).toMatchObject({
      id: "about_1",
      title: "ABOUT SHAMELL",
      heroMediaType: "IMAGE",
    });
  });

  it("returns ok false when the server errors", async () => {
    server.use(
      http.get("*/api/v1/about/admin", () =>
        HttpResponse.json({ message: "Boom" }, { status: 500 }),
      ),
    );
    const result = await fetchAdminAbout("token-1");
    expect(result.ok).toBe(false);
    expect(result.record).toBeNull();
    expect(result.status).toBe(500);
  });

  it("returns null record when body cannot be normalized", async () => {
    server.use(
      http.get("*/api/v1/about/admin", () => HttpResponse.json({ title: "no-id" })),
    );
    const result = await fetchAdminAbout("token-1");
    expect(result.ok).toBe(true);
    expect(result.record).toBeNull();
  });

  it("accepts a valid VIDEO row from the API", async () => {
    server.use(
      http.get("*/api/v1/about/admin", () =>
        HttpResponse.json(makeAdminAboutRow({ heroMediaType: "VIDEO" })),
      ),
    );
    const result = await fetchAdminAbout("token-1");
    expect(result.record?.heroMediaType).toBe("VIDEO");
  });
});
