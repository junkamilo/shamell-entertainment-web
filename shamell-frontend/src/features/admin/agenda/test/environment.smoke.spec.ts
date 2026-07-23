import { describe, expect, it } from "vitest";
import { fetchAgendaHubBadges } from "../services/fetchAgendaHubBadges";
import { fetchPeticionesBadge } from "../services/fetchPeticionesBadge";
import {
  makeAgendaHubBadges,
  makeAgendaHubCard,
} from "./fixtures/agendaHub.fixture";
import {
  FIXTURE_PAYMENTS_SINCE,
  FIXTURE_PETICIONES_SINCE,
} from "./fixtures/uuids.fixture";
import { createMockAgendaHubBadgesState } from "./helpers/mockAgendaHub";

describe("agenda hub test environment", () => {
  it("exposes usable fixtures and badge mock", () => {
    expect(makeAgendaHubBadges().peticionesBadge).toBe(0);
    expect(makeAgendaHubCard().title).toBe("Inbox");

    const state = createMockAgendaHubBadgesState({ isLoading: true });
    expect(state.isLoading).toBe(true);
    state.reload();
    expect(state.reload).toHaveBeenCalled();
  });

  it("serves hub badges and peticiones badge via MSW", async () => {
    const hub = await fetchAgendaHubBadges("token-1", {
      peticionesBookingsSince: FIXTURE_PETICIONES_SINCE,
      paymentsSince: FIXTURE_PAYMENTS_SINCE,
    });
    expect(hub.peticionesBadge).toBe(3);
    expect(hub.paymentHistoryBadge).toBe(4);

    const badge = await fetchPeticionesBadge("token-1", {
      since: FIXTURE_PETICIONES_SINCE,
      lane: "guidance",
    });
    expect(badge).toBe(6);
  });
});
