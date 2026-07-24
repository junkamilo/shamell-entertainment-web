import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminReservationEventTemplates } from "./fetchAdminReservationEventTemplates";
import { RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE } from "./reservationEventTemplateAdminRequest";
import {
  makeRecurringReservationEventTemplate,
  makeReservationEventTemplate,
} from "../../test/fixtures/onComingEvents.fixture";
import { FIXTURE_TEMPLATE_ID, FIXTURE_TEMPLATE_ID_2 } from "../../test/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/reservation-event-templates/admin";

describe("fetchAdminReservationEventTemplates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the reservation event templates list", async () => {
    const result = await fetchAdminReservationEventTemplates("token-1");
    expect(result.ok).toBe(true);
    expect(result.templates[0]?.id).toBe(FIXTURE_TEMPLATE_ID);
    expect(result.templates.length).toBe(2);
  });

  it("filters by scheduleMode query param", async () => {
    let url = "";
    server.use(
      http.get(ROUTE, ({ request }) => {
        url = request.url;
        return HttpResponse.json([makeRecurringReservationEventTemplate()]);
      }),
    );
    const result = await fetchAdminReservationEventTemplates("token-1", "RECURRING_WEEKLY");
    expect(url).toContain("scheduleMode=RECURRING_WEEKLY");
    expect(result.ok).toBe(true);
    expect(result.templates[0]?.id).toBe(FIXTURE_TEMPLATE_ID_2);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get(ROUTE, ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json([]);
      }),
    );
    await fetchAdminReservationEventTemplates("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("returns ok:false on API error", async () => {
    server.use(
      http.get(ROUTE, () => HttpResponse.json({ message: "nope" }, { status: 500 })),
    );
    const result = await fetchAdminReservationEventTemplates("token-1");
    expect(result.ok).toBe(false);
    expect(result.templates).toEqual([]);
    expect(result.message).toMatch(/nope/);
  });

  it("returns network message when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Failed to fetch");
      }),
    );
    const result = await fetchAdminReservationEventTemplates("token-1");
    expect(result).toEqual({
      ok: false,
      templates: [],
      message: RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE,
    });
  });

  it("returns ok:false when response is not an array", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json({ items: [] })));
    const result = await fetchAdminReservationEventTemplates("token-1");
    expect(result.ok).toBe(false);
    expect(result.templates).toEqual([]);
    expect(result.message).toMatch(/Could not load reservation events/);
  });
});
