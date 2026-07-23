import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminService } from "./deleteAdminService";
import { FIXTURE_SERVICE_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAdminService", () => {
  it("resolves on success", async () => {
    await expect(deleteAdminService("token-1", FIXTURE_SERVICE_ID)).resolves.toBeUndefined();
  });

  it("throws delete message on 500", async () => {
    server.use(
      http.delete("*/api/v1/services/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(deleteAdminService("token-1", FIXTURE_SERVICE_ID)).rejects.toThrow(/nope/);
  });
});
