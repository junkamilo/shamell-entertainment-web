import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { createAdminReservationEventTemplate } from "./createAdminReservationEventTemplate";
import { RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE } from "./reservationEventTemplateAdminRequest";
import { FIXTURE_TEMPLATE_ID } from "../../test/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/reservation-event-templates/admin";

describe("createAdminReservationEventTemplate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const body = {
    name: "Saturday Gala",
    scheduleMode: "FIXED_EVENT" as const,
    eventDate: "2030-08-01",
    eventStartTime: "20:00",
    eventEndTime: "23:00",
  };

  it("creates successfully", async () => {
    const result = await createAdminReservationEventTemplate("token-1", body);
    expect(result.ok).toBe(true);
    expect(result.template?.id).toBe(FIXTURE_TEMPLATE_ID);
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.post(ROUTE, async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ id: FIXTURE_TEMPLATE_ID, name: "Saturday Gala" });
      }),
    );
    await createAdminReservationEventTemplate("token-1", body);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(body);
  });

  it("returns ok:false on API error", async () => {
    server.use(
      http.post(ROUTE, () => HttpResponse.json({ message: "nope" }, { status: 500 })),
    );
    const result = await createAdminReservationEventTemplate("token-1", body);
    expect(result.ok).toBe(false);
    expect(result.template).toBeNull();
    expect(result.message).toMatch(/nope/);
  });

  it("returns network message when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Failed to fetch");
      }),
    );
    const result = await createAdminReservationEventTemplate("token-1", body);
    expect(result).toEqual({
      ok: false,
      template: null,
      message: RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE,
    });
  });
});
