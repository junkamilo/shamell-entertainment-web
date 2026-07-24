import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminHeaderText } from "./fetchAdminHeaderText";
import { FIXTURE_HEADER_TEXT_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminHeaderText", () => {
  it("loads header text", async () => {
    const result = await fetchAdminHeaderText("token-1");
    expect(result?.id).toBe(FIXTURE_HEADER_TEXT_ID);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get("*/api/v1/header-text/admin", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({
          id: FIXTURE_HEADER_TEXT_ID,
          headline: "SHAMELL",
          headlineFont: "brand",
          headlineColor: "#c5a55a",
          tagline: "Tag",
          taglineFont: "elegant",
          taglineColor: "#f5e6b8",
          quote: "Quote",
          quoteFont: "script",
          quoteColor: "#c5a55a",
          isActive: true,
          updatedAt: null,
        });
      }),
    );
    await fetchAdminHeaderText("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.get("*/api/v1/header-text/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminHeaderText("token-1")).rejects.toThrow(/nope/);
  });
});
