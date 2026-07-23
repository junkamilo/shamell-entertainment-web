import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminEventTypes } from "./fetchAdminEventTypes";
import { FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminEventTypes", () => {
  it("loads the event types list", async () => {
    const result = await fetchAdminEventTypes("token-1");
    expect(result[0]?.id).toBe(FIXTURE_EVENT_TYPE_ID);
    expect(result.length).toBeGreaterThan(0);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.get("*/api/v1/events/types/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminEventTypes("token-1")).rejects.toThrow(/nope/);
  });
});
