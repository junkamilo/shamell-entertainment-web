import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminServiceType } from "./deleteAdminServiceType";
import { FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAdminServiceType", () => {
  it("deletes successfully", async () => {
    await expect(
      deleteAdminServiceType("token-1", FIXTURE_SERVICE_TYPE_ID),
    ).resolves.toBeUndefined();
  });

  it("sends bearer token to the type id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.delete("*/api/v1/services/types/admin/:id", ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );
    await deleteAdminServiceType("token-1", FIXTURE_SERVICE_TYPE_ID);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_SERVICE_TYPE_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.delete("*/api/v1/services/types/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      deleteAdminServiceType("token-1", FIXTURE_SERVICE_TYPE_ID),
    ).rejects.toThrow(/nope/);
  });
});
