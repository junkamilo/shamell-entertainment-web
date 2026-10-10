import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@test/support/server";
import { deleteAdminEvent } from "@/features/admin/events/services/deleteAdminEvent";
import { FIXTURE_EVENT_ID } from "@test/features/admin/events/support/fixtures/uuids.fixture";

describe("deleteAdminEvent", () => {
  it("resolves on success", async () => {
    await expect(deleteAdminEvent("token-1", FIXTURE_EVENT_ID)).resolves.toBeUndefined();
  });

  it("throws delete message on 500", async () => {
    server.use(
      http.delete("*/api/v1/events/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(deleteAdminEvent("token-1", FIXTURE_EVENT_ID)).rejects.toThrow(/nope/);
  });
});
