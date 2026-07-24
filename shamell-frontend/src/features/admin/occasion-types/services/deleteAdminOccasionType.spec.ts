import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminOccasionType } from "./deleteAdminOccasionType";
import { FIXTURE_OCCASION_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAdminOccasionType", () => {
  it("deletes successfully", async () => {
    await expect(
      deleteAdminOccasionType("token-1", FIXTURE_OCCASION_TYPE_ID),
    ).resolves.toBeUndefined();
  });

  it("sends bearer token to the type id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.delete("*/api/v1/events/occasions/admin/:id", ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );
    await deleteAdminOccasionType("token-1", FIXTURE_OCCASION_TYPE_ID);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_OCCASION_TYPE_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.delete("*/api/v1/events/occasions/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      deleteAdminOccasionType("token-1", FIXTURE_OCCASION_TYPE_ID),
    ).rejects.toThrow(/nope/);
  });
});
