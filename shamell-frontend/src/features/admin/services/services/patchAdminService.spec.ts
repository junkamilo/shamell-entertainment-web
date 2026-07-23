import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminService } from "./patchAdminService";
import { FIXTURE_SERVICE_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminService", () => {
  it("resolves for id", async () => {
    let receivedId = "";
    server.use(
      http.patch("*/api/v1/services/admin/:id", ({ params }) => {
        receivedId = String(params.id);
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(
      patchAdminService("token-1", FIXTURE_SERVICE_ID, new FormData()),
    ).resolves.toBeUndefined();
    expect(receivedId).toBe(FIXTURE_SERVICE_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/services/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminService("token-1", FIXTURE_SERVICE_ID, new FormData()),
    ).rejects.toThrow(/nope/);
  });
});
