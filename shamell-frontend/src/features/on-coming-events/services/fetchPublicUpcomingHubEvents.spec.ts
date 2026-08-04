import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeUpcomingEventApiItem } from "@/lib/on-coming-events/test/fixtures/onComingEventsLib.fixture";
import { FIXTURE_EVENT_SLUG } from "@/lib/on-coming-events/test/fixtures/uuids.fixture";
import { fetchPublicUpcomingHubEvents } from "./fetchPublicUpcomingHubEvents";

describe("fetchPublicUpcomingHubEvents", () => {
  it("maps upcoming events from the public API", async () => {
    server.use(
      http.get("*/api/v1/events", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("publicSection") === "UPCOMING_EVENTS") {
          return HttpResponse.json([
            makeUpcomingEventApiItem({
              eventTypeName: "Weekly Bachata",
              experienceType: "CLASSES",
              purchaseMode: "classes",
            }),
          ]);
        }
        return HttpResponse.json([]);
      }),
    );
    const events = await fetchPublicUpcomingHubEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        slug: FIXTURE_EVENT_SLUG,
        eventTypeName: "Weekly Bachata",
        purchaseMode: "classes",
      }),
    );
  });

  it("returns empty array when the response is not ok", async () => {
    server.use(
      http.get("*/api/v1/events", () =>
        HttpResponse.json({ message: "fail" }, { status: 500 }),
      ),
    );
    await expect(fetchPublicUpcomingHubEvents()).resolves.toEqual([]);
  });
});
