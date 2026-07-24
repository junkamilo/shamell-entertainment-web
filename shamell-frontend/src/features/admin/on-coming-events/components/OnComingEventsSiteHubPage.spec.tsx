/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { createMockVenueLayoutPromoPageState } from "../test/helpers/mockVenueLayoutPromoPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

let tabQuery: string | null = null;

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "tab" ? tabQuery : null),
  }),
}));

vi.mock("../hooks/useAdminVenueLayoutPromoPage", () => ({
  useAdminVenueLayoutPromoPage: () => createMockVenueLayoutPromoPageState(),
}));

vi.mock("@/components/admin/layout", () => ({
  ModuleHero: ({
    title,
    actionLabel,
    onAction,
  }: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <div>
      <h1>{title}</h1>
      {actionLabel ? (
        <button type="button" onClick={onAction} data-testid="hero-action">
          {actionLabel}
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("./OnComingEventsSiteSectionTabs", () => ({
  OnComingEventsSiteSectionTabs: ({ activeTab }: { activeTab: string }) => (
    <div data-testid="site-section-tabs">{activeTab}</div>
  ),
}));

vi.mock("@/features/admin/events/components/EventsPage", () => ({
  default: () => <div data-testid="events-page" />,
}));

vi.mock("./VenueLayoutReservationTabPanel", () => ({
  VenueLayoutReservationTabPanel: () => (
    <div data-testid="reservation-tab-panel" />
  ),
}));

import { OnComingEventsSiteHubPage } from "./OnComingEventsSiteHubPage";

describe("OnComingEventsSiteHubPage", () => {
  beforeEach(() => {
    tabQuery = null;
  });

  it("renders hero and upcoming events tab by default", () => {
    renderWithProviders(<OnComingEventsSiteHubPage />);
    expect(
      screen.getByRole("heading", { name: "On Coming Events (site)" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("site-section-tabs")).toHaveTextContent("upcoming");
    expect(screen.getByTestId("events-page")).toBeInTheDocument();
  });

  it("renders reservation tab panel when tab=reservation", () => {
    tabQuery = "reservation";
    renderWithProviders(<OnComingEventsSiteHubPage />);
    expect(screen.getByTestId("site-section-tabs")).toHaveTextContent(
      "reservation",
    );
    expect(screen.getByTestId("reservation-tab-panel")).toBeInTheDocument();
    expect(screen.getByTestId("hero-action")).toHaveTextContent(
      "Edit home section",
    );
  });
});
