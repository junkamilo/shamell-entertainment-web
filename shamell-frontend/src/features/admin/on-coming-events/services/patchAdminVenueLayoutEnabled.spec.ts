import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminVenueLayoutEnabled } from "./patchAdminVenueLayoutEnabled";

const ROUTE = "*/api/v1/on-coming-events/settings/admin/enabled";

describe("patchAdminVenueLayoutEnabled", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("toggles clientEnabled and returns settings", async () => {
    let body: unknown = null;
    server.use(
      http.patch(ROUTE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          settings: {
            clientEnabled: true,
            promoTitle: "On Coming Events",
            promoDescription: "Reserve seats for our next night.",
            promoImageUrl: null,
            reservationEventDate: null,
            reservationOpensAt: null,
            reservationClosesAt: null,
            reservationEventLabel: null,
            reservationTimezone: "America/New_York",
            updatedAt: "2026-07-20T12:00:00.000Z",
          },
          message: "Published.",
        });
      }),
    );

    const result = await patchAdminVenueLayoutEnabled("token-1", true);
    expect(body).toEqual({ clientEnabled: true });
    expect(result.ok).toBe(true);
    expect(result.settings?.clientEnabled).toBe(true);
    expect(result.message).toBe("Published.");
  });

  it("returns ok:false with API message on error", async () => {
    server.use(
      http.patch(ROUTE, () =>
        HttpResponse.json({ message: "Publish blocked" }, { status: 403 }),
      ),
    );
    const result = await patchAdminVenueLayoutEnabled("token-1", false);
    expect(result).toEqual({
      ok: false,
      settings: null,
      message: "Publish blocked",
    });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await patchAdminVenueLayoutEnabled("token-1", true);
    expect(result).toEqual({
      ok: false,
      settings: null,
      message: "Could not reach server.",
    });
  });
});
