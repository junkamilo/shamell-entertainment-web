import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@test/support/server";
import { deleteAdminReservationEventTemplate } from "@/features/admin/on-coming-events/reservation-events/services/deleteAdminReservationEventTemplate";
import { RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE } from "@/features/admin/on-coming-events/reservation-events/services/reservationEventTemplateAdminRequest";
import { FIXTURE_TEMPLATE_ID } from "@test/features/admin/on-coming-events/support/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/reservation-event-templates/admin/:id";

describe("deleteAdminReservationEventTemplate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes successfully", async () => {
    const result = await deleteAdminReservationEventTemplate("token-1", FIXTURE_TEMPLATE_ID);
    expect(result.ok).toBe(true);
  });

  it("sends bearer token to the template id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.delete(ROUTE, ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );
    await deleteAdminReservationEventTemplate("token-1", FIXTURE_TEMPLATE_ID);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_TEMPLATE_ID);
  });

  it("returns ok:false on API error", async () => {
    server.use(
      http.delete(ROUTE, () => HttpResponse.json({ message: "nope" }, { status: 500 })),
    );
    const result = await deleteAdminReservationEventTemplate("token-1", FIXTURE_TEMPLATE_ID);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/nope/);
  });

  it("returns network message when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Failed to fetch");
      }),
    );
    const result = await deleteAdminReservationEventTemplate("token-1", FIXTURE_TEMPLATE_ID);
    expect(result).toEqual({
      ok: false,
      message: RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE,
    });
  });
});
