import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  fetchOnComingEventsSettings,
  fetchVenueLayoutSettings,
} from "./fetchVenueLayoutSettings";

describe("fetchOnComingEventsSettings", () => {
  it("loads promo and reservation settings", async () => {
    const settings = await fetchOnComingEventsSettings();
    expect(settings?.clientEnabled).toBe(true);
    expect(settings?.promoTitle).toBe("On Coming Events");
    expect(settings?.reservationTimezone).toBe("America/New_York");
  });

  it("returns null on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/on-coming-events/settings", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    await expect(fetchOnComingEventsSettings()).resolves.toBeNull();
  });

  it("returns null on invalid body", async () => {
    server.use(
      http.get("*/api/v1/on-coming-events/settings", () => HttpResponse.json(null)),
    );
    await expect(fetchOnComingEventsSettings()).resolves.toBeNull();
  });
});

describe("fetchVenueLayoutSettings", () => {
  it("is an alias for fetchOnComingEventsSettings", () => {
    expect(fetchVenueLayoutSettings).toBe(fetchOnComingEventsSettings);
  });
});
