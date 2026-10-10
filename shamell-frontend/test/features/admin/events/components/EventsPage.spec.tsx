/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockEventsPageState } from "@test/features/admin/events/support/helpers/mockEventsPage";
import { renderWithProviders } from "@test/features/admin/events/support/helpers/renderWithProviders";

vi.mock("@/features/admin/events/hooks/useEventsPage", () => ({
  useEventsPage: () => createMockEventsPageState(),
}));

vi.mock("@/features/admin/events/components/EventsPageContent", () => ({
  default: () => <div data-testid="events-page-content" />,
}));

import EventsPage from "@/features/admin/events/components/EventsPage";

describe("EventsPage", () => {
  it("renders EventsPageContent", () => {
    renderWithProviders(<EventsPage />);
    expect(screen.getByTestId("events-page-content")).toBeInTheDocument();
  });

  it("loads page state via useEventsPage", () => {
    renderWithProviders(<EventsPage />);
    expect(screen.getByTestId("events-page-content")).toBeVisible();
  });

  it("accepts embedded and upcomingOnly props", () => {
    renderWithProviders(<EventsPage embedded upcomingOnly />);
    expect(screen.getByTestId("events-page-content")).toBeInTheDocument();
  });
});
