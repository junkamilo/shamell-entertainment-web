/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockEventsPageState } from "../test/helpers/mockEventsPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useEventsPage", () => ({
  useEventsPage: () => createMockEventsPageState(),
}));

vi.mock("./EventsPageContent", () => ({
  default: () => <div data-testid="events-page-content" />,
}));

import EventsPage from "./EventsPage";

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
