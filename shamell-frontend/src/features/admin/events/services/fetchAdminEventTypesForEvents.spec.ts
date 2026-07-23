import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminEventTypesForEvents } from "./fetchAdminEventTypesForEvents";
import { FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminEventTypesForEvents", () => {
  it("loads event type options", async () => {
    const result = await fetchAdminEventTypesForEvents("token-1");
    expect(result[0]?.id).toBe(FIXTURE_EVENT_TYPE_ID);
    expect(result[0]).toMatchObject({
      id: FIXTURE_EVENT_TYPE_ID,
      name: expect.any(String),
      isActive: expect.any(Boolean),
    });
    expect(result.length).toBeGreaterThan(0);
  });

  it("forwards publicSection as a query param", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/events/types/admin", ({ request }) => {
        url = request.url;
        return HttpResponse.json([]);
      }),
    );
    await fetchAdminEventTypesForEvents("token-1", { publicSection: "GENERAL" });
    expect(url).toContain("publicSection=GENERAL");
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.get("*/api/v1/events/types/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminEventTypesForEvents("token-1")).rejects.toThrow(/nope/);
  });
});
