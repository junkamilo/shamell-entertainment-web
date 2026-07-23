import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminServiceActive } from "./patchAdminServiceActive";
import { FIXTURE_SERVICE_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminServiceActive", () => {
  it("resolves on success", async () => {
    await expect(
      patchAdminServiceActive("token-1", FIXTURE_SERVICE_ID, false),
    ).resolves.toBeUndefined();
  });

  it("throws with status message on 500", async () => {
    server.use(
      http.patch("*/api/v1/services/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminServiceActive("token-1", FIXTURE_SERVICE_ID, true),
    ).rejects.toThrow(/nope/);
  });
});
