import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminServiceClearImage } from "./patchAdminServiceClearImage";
import { FIXTURE_SERVICE_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminServiceClearImage", () => {
  it("resolves on success", async () => {
    await expect(
      patchAdminServiceClearImage("token-1", FIXTURE_SERVICE_ID),
    ).resolves.toBeUndefined();
  });

  it("throws media message on 500", async () => {
    server.use(
      http.patch("*/api/v1/services/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminServiceClearImage("token-1", FIXTURE_SERVICE_ID),
    ).rejects.toThrow(/nope/);
  });
});
