import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  fetchAdminVenueConfig,
  patchAdminVenueConfig,
} from "./patchAdminVenueConfig";
import { makeAdminVenueConfig } from "../test/fixtures/onComingEvents.fixture";
import {
  FIXTURE_EVENT_ID,
  FIXTURE_VENUE_CONFIG_ID,
} from "../test/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/upcoming-events/admin/events/:eventId/venue-config";

describe("fetchAdminVenueConfig", () => {
  it("loads venue config for the event", async () => {
    const result = await fetchAdminVenueConfig("token-1", FIXTURE_EVENT_ID);
    expect(result.ok).toBe(true);
    expect(result.config?.id).toBe(FIXTURE_VENUE_CONFIG_ID);
    expect(result.config?.eventId).toBe(FIXTURE_EVENT_ID);
  });

  it("returns ok:true with null config when API returns null", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json(null)));
    const result = await fetchAdminVenueConfig("token-1", FIXTURE_EVENT_ID);
    expect(result).toEqual({ ok: true, config: null });
  });

  it("returns ok:false on API error", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json({}, { status: 404 })));
    const result = await fetchAdminVenueConfig("token-1", FIXTURE_EVENT_ID);
    expect(result).toEqual({ ok: false, config: null });
  });
});

describe("patchAdminVenueConfig", () => {
  it("patches venue config and returns the saved row", async () => {
    let body: unknown = null;
    server.use(
      http.patch(ROUTE, async ({ request, params }) => {
        body = await request.json();
        return HttpResponse.json(
          makeAdminVenueConfig({
            eventId: String(params.eventId),
            clientEnabled: false,
          }),
        );
      }),
    );

    const result = await patchAdminVenueConfig("token-1", FIXTURE_EVENT_ID, {
      clientEnabled: false,
    });

    expect(body).toEqual({ clientEnabled: false });
    expect(result.ok).toBe(true);
    expect(result.config?.eventId).toBe(FIXTURE_EVENT_ID);
    expect(result.config?.clientEnabled).toBe(false);
  });

  it("returns ok:false with API message on error", async () => {
    server.use(
      http.patch(ROUTE, () =>
        HttpResponse.json({ message: "Invalid template" }, { status: 400 }),
      ),
    );
    const result = await patchAdminVenueConfig("token-1", FIXTURE_EVENT_ID, {
      reservationEventTemplateId: null,
    });
    expect(result).toEqual({
      ok: false,
      config: null,
      message: "Invalid template",
    });
  });

  it("returns ok:false when the success body is missing eventId", async () => {
    server.use(http.patch(ROUTE, () => HttpResponse.json({ ok: true })));
    const result = await patchAdminVenueConfig("token-1", FIXTURE_EVENT_ID, {
      clientEnabled: true,
    });
    expect(result).toEqual({
      ok: false,
      config: null,
      message: "Could not save venue config.",
    });
  });
});
