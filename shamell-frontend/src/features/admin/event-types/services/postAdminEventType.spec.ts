import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminEventType } from "./postAdminEventType";
import { FIXTURE_OCCASION_ID } from "../test/fixtures/uuids.fixture";

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
