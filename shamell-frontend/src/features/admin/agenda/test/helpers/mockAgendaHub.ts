import { vi } from "vitest";
import { makeAgendaHubBadges } from "../fixtures/agendaHub.fixture";

export function createMockAgendaHubBadgesState(
  overrides: Record<string, unknown> = {},
) {
  const badges = makeAgendaHubBadges({
    peticionesBadge: 2,
    paymentHistoryBadge: 1,
  });
  return {
    badges,
    isLoading: false,
    error: null as string | null,
    reload: vi.fn(async () => undefined),
    ...overrides,
  };
}
