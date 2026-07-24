import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { upsertAdminVenueLayoutPromoMedia } from "./upsertAdminVenueLayoutPromoMedia";

const ROUTE = "*/api/v1/on-coming-events/settings/admin/media";

describe("upsertAdminVenueLayoutPromoMedia", () => {
  it("uploads media and returns updated settings", async () => {
    let auth: string | null = null;
    server.use(
      http.patch(ROUTE, ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({
          settings: {
            clientEnabled: true,
            promoTitle: "On Coming Events",
            promoDescription: "Reserve seats for our next night.",
            promoImageUrl: "https://cdn.example.com/promo-new.jpg",
            reservationEventDate: null,
            reservationOpensAt: null,
            reservationClosesAt: null,
            reservationEventLabel: null,
            reservationTimezone: "America/New_York",
            updatedAt: "2026-07-20T12:00:00.000Z",
          },
          message: "Media updated.",
        });
      }),
    );

    const file = new File(["image"], "promo.jpg", { type: "image/jpeg" });
    const result = await upsertAdminVenueLayoutPromoMedia("token-1", file);

    expect(auth).toBe("Bearer token-1");
    expect(result.ok).toBe(true);
    expect(result.settings?.promoImageUrl).toBe("https://cdn.example.com/promo-new.jpg");
    expect(result.message).toBe("Media updated.");
  });

  it("returns ok:false with API message on error", async () => {
    server.use(
      http.patch(ROUTE, () =>
        HttpResponse.json({ message: "File too large" }, { status: 413 }),
      ),
    );
    const file = new File(["image"], "promo.jpg", { type: "image/jpeg" });
    const result = await upsertAdminVenueLayoutPromoMedia("token-1", file);
    expect(result).toEqual({
      ok: false,
      settings: null,
      message: "File too large",
    });
  });
});
