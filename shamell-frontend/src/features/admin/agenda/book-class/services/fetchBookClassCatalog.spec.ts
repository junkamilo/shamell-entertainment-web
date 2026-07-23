import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  fetchBookClassEventContext,
  fetchBookClassEventsCatalog,
} from "./fetchBookClassCatalog";
import { FIXTURE_CLASS_EVENT_ID } from "../test/fixtures/uuids.fixture";

describe("fetchBookClassEventsCatalog", () => {
  it("returns events sorted by name", async () => {
    const events = await fetchBookClassEventsCatalog("token-1");
    expect(events.map((e) => e.name)).toEqual(["Bachata Labs", "Salsa Foundations"]);
    expect(events[0]).toMatchObject({
      id: expect.any(String),
      slug: expect.any(String),
    });
  });

  it("returns an empty list when events is not an array", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/admin/bookable-class-events", () =>
        HttpResponse.json({ events: null }),
      ),
    );
    await expect(fetchBookClassEventsCatalog("token-1")).resolves.toEqual([]);
  });

  it("throws the API message on failure", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/admin/bookable-class-events", () =>
        HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
      ),
    );
    await expect(fetchBookClassEventsCatalog("token-1")).rejects.toThrow("Forbidden");
  });

  it("throws a default message when the error body has none", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/admin/bookable-class-events", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    await expect(fetchBookClassEventsCatalog("token-1")).rejects.toThrow(
      "Could not load class events.",
    );
  });

  it("throws when the success body is not an object", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/admin/bookable-class-events", () =>
        HttpResponse.json(null),
      ),
    );
    await expect(fetchBookClassEventsCatalog("token-1")).rejects.toThrow(
      "Invalid class events response.",
    );
  });
});

describe("fetchBookClassEventContext", () => {
  it("returns the class booking context", async () => {
    const context = await fetchBookClassEventContext("token-1", FIXTURE_CLASS_EVENT_ID);
    expect(context.event.id).toBe(FIXTURE_CLASS_EVENT_ID);
    expect(context.readiness?.isBookable).toBe(true);
    expect(context.sessions.length).toBeGreaterThan(0);
  });

  it("URL-encodes the event id", async () => {
    let requestedPath = "";
    server.use(
      http.get(
        "*/api/v1/upcoming-events/admin/events/:eventId/class-booking-context",
        ({ request }) => {
          requestedPath = new URL(request.url).pathname;
          return HttpResponse.json({
            event: {
              id: "id/with spaces",
              slug: "x",
              name: "X",
              timezone: "America/New_York",
            },
            schedule: null,
            sessions: [],
            monthPackage: null,
          });
        },
      ),
    );

    await fetchBookClassEventContext("token-1", "id/with spaces");
    expect(requestedPath).toContain("id%2Fwith%20spaces");
  });

  it("throws the API message on failure", async () => {
    server.use(
      http.get(
        "*/api/v1/upcoming-events/admin/events/:eventId/class-booking-context",
        () => HttpResponse.json({ message: "Not found" }, { status: 404 }),
      ),
    );
    await expect(
      fetchBookClassEventContext("token-1", FIXTURE_CLASS_EVENT_ID),
    ).rejects.toThrow("Not found");
  });

  it("throws a default message when the error body has none", async () => {
    server.use(
      http.get(
        "*/api/v1/upcoming-events/admin/events/:eventId/class-booking-context",
        () => HttpResponse.json({}, { status: 500 }),
      ),
    );
    await expect(
      fetchBookClassEventContext("token-1", FIXTURE_CLASS_EVENT_ID),
    ).rejects.toThrow("Could not load class event.");
  });

  it("throws when the success body is invalid", async () => {
    server.use(
      http.get(
        "*/api/v1/upcoming-events/admin/events/:eventId/class-booking-context",
        () => HttpResponse.json(null),
      ),
    );
    await expect(
      fetchBookClassEventContext("token-1", FIXTURE_CLASS_EVENT_ID),
    ).rejects.toThrow("Invalid class event response.");
  });
});
