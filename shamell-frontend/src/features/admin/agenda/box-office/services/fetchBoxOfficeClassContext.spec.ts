import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { FIXTURE_CLASS_EVENT_ID } from "../test/fixtures/uuids.fixture";
import { fetchBoxOfficeClassContext } from "./fetchBoxOfficeClassContext";

const ROUTE_TEMPLATE =
  "*/api/v1/upcoming-events/admin/events/:eventId/class-booking-context";

describe("fetchBoxOfficeClassContext", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ok:true with the class booking context", async () => {
    const result = await fetchBoxOfficeClassContext(
      "token-1",
      FIXTURE_CLASS_EVENT_ID,
    );
    expect(result.ok).toBe(true);
    expect(result.context?.event.id).toBe(FIXTURE_CLASS_EVENT_ID);
    expect(result.context?.sessions.length).toBeGreaterThan(0);
  });

  it("URL-encodes the event id", async () => {
    let requestedPath = "";
    server.use(
      http.get(ROUTE_TEMPLATE, ({ request }) => {
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
      }),
    );

    await fetchBoxOfficeClassContext("token-1", "id/with spaces");
    expect(requestedPath).toContain("id%2Fwith%20spaces");
  });

  it("returns ok:false with the API message on error", async () => {
    server.use(
      http.get(ROUTE_TEMPLATE, () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 }),
      ),
    );
    const result = await fetchBoxOfficeClassContext(
      "token-1",
      FIXTURE_CLASS_EVENT_ID,
    );
    expect(result).toEqual({
      ok: false,
      context: null,
      message: "Not found",
    });
  });

  it("returns a default failure message when the error body has none", async () => {
    server.use(
      http.get(ROUTE_TEMPLATE, () => HttpResponse.json({}, { status: 500 })),
    );
    const result = await fetchBoxOfficeClassContext(
      "token-1",
      FIXTURE_CLASS_EVENT_ID,
    );
    expect(result).toEqual({
      ok: false,
      context: null,
      message: "Could not load class event.",
    });
  });

  it("returns ok:false when the success body is invalid", async () => {
    server.use(http.get(ROUTE_TEMPLATE, () => HttpResponse.json(null)));
    const result = await fetchBoxOfficeClassContext(
      "token-1",
      FIXTURE_CLASS_EVENT_ID,
    );
    expect(result).toEqual({
      ok: false,
      context: null,
      message: "Invalid response.",
    });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await fetchBoxOfficeClassContext(
      "token-1",
      FIXTURE_CLASS_EVENT_ID,
    );
    expect(result).toEqual({
      ok: false,
      context: null,
      message: "Could not reach the server.",
    });
  });
});
