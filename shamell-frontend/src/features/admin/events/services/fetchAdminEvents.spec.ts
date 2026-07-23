import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminEvents } from "./fetchAdminEvents";
import { FIXTURE_EVENT_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminEvents", () => {
  it("loads the events list", async () => {
    const result = await fetchAdminEvents("token-1");
    expect(result[0]?.id).toBe(FIXTURE_EVENT_ID);
    expect(result.length).toBeGreaterThan(0);
  });

  it("forwards publicSection as a query param", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/events/admin", ({ request }) => {
        url = request.url;
        return HttpResponse.json([]);
      }),
    );
    await fetchAdminEvents("token-1", { publicSection: "UPCOMING_EVENTS" });
    expect(url).toContain("publicSection=UPCOMING_EVENTS");
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.get("*/api/v1/events/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminEvents("token-1")).rejects.toThrow(/nope/);
  });
});
