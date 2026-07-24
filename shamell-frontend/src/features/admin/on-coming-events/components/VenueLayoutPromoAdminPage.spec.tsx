/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockVenueLayoutPromoPageState } from "../test/helpers/mockVenueLayoutPromoPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useAdminVenueLayoutPromoPage", () => ({
  useAdminVenueLayoutPromoPage: () => createMockVenueLayoutPromoPageState(),
}));

vi.mock("@/components/admin/layout", () => ({
  ModuleHero: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("./VenueLayoutPromoSectionTabs", () => ({
  VenueLayoutPromoSectionTabs: ({
    activeTab,
    onTabChange,
  }: {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }) => (
    <div>
      <span data-testid="active-tab">{activeTab}</span>
      <button type="button" onClick={() => onTabChange("home-promo")}>
        Home promo preview
      </button>
    </div>
  ),
}));

vi.mock("./VenueLayoutPromoModuleSection", () => ({
  VenueLayoutPromoModuleSection: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section data-testid={`module-${title}`}>{children}</section>
  ),
}));

vi.mock("./VenueLayoutPublishCard", () => ({
  VenueLayoutPublishCard: () => <div data-testid="publish-card" />,
}));

vi.mock("./VenueLayoutReservationEventCard", () => ({
  VenueLayoutReservationEventCard: () => (
    <div data-testid="reservation-event-card" />
  ),
}));

vi.mock("./VenueLayoutPromoPreview", () => ({
  VenueLayoutPromoPreview: () => <div data-testid="promo-preview" />,
}));

vi.mock("./VenueLayoutPromoEditModal", () => ({
  VenueLayoutPromoEditModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="promo-edit-modal" /> : null,
}));

import { VenueLayoutPromoAdminPage } from "./VenueLayoutPromoAdminPage";

describe("VenueLayoutPromoAdminPage", () => {
  it("renders reservation tab content by default", () => {
    renderWithProviders(<VenueLayoutPromoAdminPage />);
    expect(
      screen.getByRole("heading", { name: "On Coming Events (site)" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("active-tab")).toHaveTextContent("reservation");
    expect(screen.getByTestId("publish-card")).toBeInTheDocument();
    expect(screen.getByTestId("reservation-event-card")).toBeInTheDocument();
  });

  it("switches to home promo preview tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VenueLayoutPromoAdminPage />);
    await user.click(screen.getByRole("button", { name: "Home promo preview" }));
    expect(screen.getByTestId("promo-preview")).toBeInTheDocument();
  });
});
