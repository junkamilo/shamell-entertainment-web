import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminReservationEventTemplate } from "./patchAdminReservationEventTemplate";
import { RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE } from "./reservationEventTemplateAdminRequest";
import { FIXTURE_TEMPLATE_ID } from "../../test/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/reservation-event-templates/admin/:id";

describe("patchAdminReservationEventTemplate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const body = { name: "Updated Gala" };

  it("updates successfully", async () => {
    const result = await patchAdminReservationEventTemplate(
      "token-1",
      FIXTURE_TEMPLATE_ID,
      body,
    );
    expect(result.ok).toBe(true);
    expect(result.template?.id).toBe(FIXTURE_TEMPLATE_ID);
  });

  it("sends JSON body with bearer token to the template id", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    let url = "";
    server.use(
      http.patch(ROUTE, async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        url = request.url;
        return HttpResponse.json({ id: FIXTURE_TEMPLATE_ID, name: "Updated Gala" });
      }),
    );
    await patchAdminReservationEventTemplate("token-1", FIXTURE_TEMPLATE_ID, body);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(body);
    expect(url).toContain(FIXTURE_TEMPLATE_ID);
  });

  it("returns ok:false on API error", async () => {
    server.use(
      http.patch(ROUTE, () => HttpResponse.json({ message: "nope" }, { status: 500 })),
    );
    const result = await patchAdminReservationEventTemplate(
      "token-1",
      FIXTURE_TEMPLATE_ID,
      body,
    );
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
    const result = await patchAdminReservationEventTemplate(
      "token-1",
      FIXTURE_TEMPLATE_ID,
      body,
    );
    expect(result).toEqual({
      ok: false,
      template: null,
      message: RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE,
    });
  });
});
