import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminVenueLayoutPromoMedia } from "./deleteAdminVenueLayoutPromoMedia";

const ROUTE = "*/api/v1/on-coming-events/settings/admin/media";

describe("deleteAdminVenueLayoutPromoMedia", () => {
  it("removes media and returns updated settings", async () => {
    let method: string | null = null;
    server.use(
      http.delete(ROUTE, ({ request }) => {
        method = request.method;
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
          message: "Media removed.",
        });
      }),
    );

    const result = await deleteAdminVenueLayoutPromoMedia("token-1");
    expect(method).toBe("DELETE");
    expect(result.ok).toBe(true);
    expect(result.settings?.promoImageUrl).toBeNull();
    expect(result.message).toBe("Media removed.");
  });

  it("returns ok:false with API message on error", async () => {
    server.use(
      http.delete(ROUTE, () =>
        HttpResponse.json({ message: "Nothing to delete" }, { status: 404 }),
      ),
    );
    const result = await deleteAdminVenueLayoutPromoMedia("token-1");
    expect(result).toEqual({
      ok: false,
      settings: null,
      message: "Nothing to delete",
    });
  });
});
