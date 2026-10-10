/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeAgendaHubBadges } from "@test/features/admin/agenda/support/fixtures/agendaHub.fixture";
import { renderWithProviders } from "@test/features/admin/agenda/support/helpers/renderWithProviders";

const useAgendaHubBadgeMock = vi.fn();

vi.mock("@/features/admin/agenda/hooks/useAgendaHubBadge", () => ({
  useAgendaHubBadge: () => useAgendaHubBadgeMock(),
}));

vi.mock("@/features/admin/agenda/components/AgendaHubPageContent", () => ({
  default: ({
    peticionesBadge,
    paymentHistoryBadge,
  }: {
    peticionesBadge: number;
    paymentHistoryBadge: number;
  }) => (
    <div
      data-testid="agenda-hub-page-content"
      data-peticiones={peticionesBadge}
      data-payments={paymentHistoryBadge}
    />
  ),
}));

import AgendaHubPage from "@/features/admin/agenda/components/AgendaHubPage";

describe("AgendaHubPage", () => {
  it("renders AgendaHubPageContent with badge values from the hook", () => {
    useAgendaHubBadgeMock.mockReturnValue(
      makeAgendaHubBadges({ peticionesBadge: 5, paymentHistoryBadge: 2 }),
    );

    renderWithProviders(<AgendaHubPage />);

    const content = screen.getByTestId("agenda-hub-page-content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("data-peticiones", "5");
    expect(content).toHaveAttribute("data-payments", "2");
  });
});
