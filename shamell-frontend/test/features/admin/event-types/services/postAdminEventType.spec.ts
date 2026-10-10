import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@test/support/server";
import { postAdminEventType } from "@/features/admin/event-types/services/postAdminEventType";
import { FIXTURE_OCCASION_ID } from "@test/features/admin/event-types/support/fixtures/uuids.fixture";

const body = {
  name: "Private weddings",
  occasions: [{ occasionTypeId: FIXTURE_OCCASION_ID, usage: "OCCASION_SINGLE" as const }],
};

describe("postAdminEventType", () => {
  it("resolves on success", async () => {
    await expect(postAdminEventType("token-1", body)).resolves.toBeUndefined();
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/events/types/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(postAdminEventType("token-1", body)).rejects.toThrow(/nope/);
  });
});
