import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminVenueLayoutSettings } from "./patchAdminVenueLayoutSettings";
import { FIXTURE_SETTINGS_ID } from "../test/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/on-coming-events/settings/admin";

describe("patchAdminVenueLayoutSettings", () => {
  it("saves promo fields and returns settings", async () => {
    let body: unknown = null;
    server.use(
      http.patch(ROUTE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          settings: {
            id: FIXTURE_SETTINGS_ID,
            clientEnabled: true,
            promoTitle: "New title",
            promoDescription: "New description",
            promoImageUrl: null,
            reservationEventDate: null,
            reservationOpensAt: null,
            reservationClosesAt: null,
            reservationEventLabel: null,
            reservationTimezone: "America/New_York",
            updatedAt: "2026-07-20T12:00:00.000Z",
          },
          message: "Saved.",
        });
      }),
    );

    const result = await patchAdminVenueLayoutSettings("token-1", {
      promoTitle: "New title",
      promoDescription: "New description",
    });

    expect(body).toEqual({
      promoTitle: "New title",
      promoDescription: "New description",
    });
    expect(result.ok).toBe(true);
    expect(result.settings?.promoTitle).toBe("New title");
    expect(result.message).toBe("Saved.");
  });

  it("returns ok:false with API message on error", async () => {
    server.use(
      http.patch(ROUTE, () =>
        HttpResponse.json({ message: "Validation failed" }, { status: 400 }),
      ),
    );
    const result = await patchAdminVenueLayoutSettings("token-1", {
      promoTitle: "",
      promoDescription: "",
    });
    expect(result).toEqual({
      ok: false,
      settings: null,
      message: "Validation failed",
    });
  });

  it("returns a default failure message when the error body has none", async () => {
    server.use(http.patch(ROUTE, () => HttpResponse.json({}, { status: 500 })));
    const result = await patchAdminVenueLayoutSettings("token-1", {
      promoTitle: "Title",
      promoDescription: "Description",
    });
    expect(result).toEqual({
      ok: false,
      settings: null,
      message: "Could not save settings.",
    });
  });
});
