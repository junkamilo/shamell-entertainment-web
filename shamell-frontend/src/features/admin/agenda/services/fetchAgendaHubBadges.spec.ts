import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAgendaHubBadges } from "./fetchAgendaHubBadges";
import {
  FIXTURE_PAYMENTS_SINCE,
  FIXTURE_PETICIONES_SINCE,
} from "../test/fixtures/uuids.fixture";

describe("fetchAgendaHubBadges", () => {
  it("loads hub badges without since params", async () => {
    const result = await fetchAgendaHubBadges("token-1", {});
    expect(result.peticionesBadge).toBe(2);
    expect(result.paymentHistoryBadge).toBe(1);
  });

  it("forwards since query params and returns counts", async () => {
    const result = await fetchAgendaHubBadges("token-1", {
      peticionesBookingsSince: FIXTURE_PETICIONES_SINCE,
      peticionesGuidanceSince: FIXTURE_PETICIONES_SINCE,
      peticionesPrivateClassesSince: FIXTURE_PETICIONES_SINCE,
      paymentsSince: FIXTURE_PAYMENTS_SINCE,
    });
    expect(result.peticionesBadge).toBe(3);
    expect(result.paymentHistoryBadge).toBe(4);
  });

  it("throws when the request fails", async () => {
    server.use(
      http.get("*/api/v1/agenda/hub-badges", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAgendaHubBadges("token-1", {})).rejects.toThrow(/nope/);
  });
});
