import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminHeaderText } from "./patchAdminHeaderText";
import { makeAdminHeaderTextRow } from "../test/fixtures/headerMedia.fixture";
import { FIXTURE_HEADER_TEXT_ID } from "../test/fixtures/uuids.fixture";

const payload = {
  headline: "SHAMELL",
  tagline: "Tagline",
  quote: "Quote",
};

describe("patchAdminHeaderText", () => {
  it("returns mapped row on success", async () => {
    const result = await patchAdminHeaderText("token-1", payload);
    expect(result.id).toBe(FIXTURE_HEADER_TEXT_ID);
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/header-text/admin", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json(makeAdminHeaderTextRow());
      }),
    );
    await patchAdminHeaderText("token-1", payload);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(payload);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/header-text/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(patchAdminHeaderText("token-1", payload)).rejects.toThrow(/nope/);
  });

  it("throws when response cannot be mapped", async () => {
    server.use(
      http.patch("*/api/v1/header-text/admin", () =>
        HttpResponse.json({ ok: true }),
      ),
    );
    await expect(patchAdminHeaderText("token-1", payload)).rejects.toThrow(
      /Invalid response/,
    );
  });
});
