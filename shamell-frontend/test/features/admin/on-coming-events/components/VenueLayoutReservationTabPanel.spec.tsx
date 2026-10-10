/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockVenueLayoutPromoPageState } from "@test/features/admin/on-coming-events/support/helpers/mockVenueLayoutPromoPage";
import { renderWithProviders } from "@test/features/admin/on-coming-events/support/helpers/renderWithProviders";
import { VenueLayoutReservationTabPanel } from "@/features/admin/on-coming-events/components/VenueLayoutReservationTabPanel";

vi.mock("@/features/admin/on-coming-events/components/VenueLayoutPromoModuleSection", () => ({
  VenueLayoutPromoModuleSection: ({
    title,
    children,
    headerAction,
  }: {
    title: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
  }) => (
    <section data-testid={`module-${title}`}>
      {headerAction}
      {children}
    </section>
  ),
}));

vi.mock("@/features/admin/on-coming-events/components/VenueLayoutPublishCard", () => ({
  VenueLayoutPublishCard: () => <div data-testid="publish-card" />,
}));

vi.mock("@/features/admin/on-coming-events/components/VenueLayoutPromoPreview", () => ({
  VenueLayoutPromoPreview: () => <div data-testid="promo-preview" />,
}));

vi.mock("@/features/admin/on-coming-events/components/VenueLayoutPromoEditModal", () => ({
  VenueLayoutPromoEditModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="promo-edit-modal" /> : null,
}));

describe("VenueLayoutReservationTabPanel", () => {
  it("renders publish and home section modules", () => {
    const page = createMockVenueLayoutPromoPageState();
    renderWithProviders(<VenueLayoutReservationTabPanel page={page as never} />);
    expect(screen.getByTestId("module-Public site")).toBeInTheDocument();
    expect(screen.getByTestId("module-Home section copy")).toBeInTheDocument();
    expect(screen.getByTestId("publish-card")).toBeInTheDocument();
    expect(screen.getByTestId("promo-preview")).toBeInTheDocument();
  });

  it("opens edit modal via header action", async () => {
    const user = userEvent.setup();
    const page = createMockVenueLayoutPromoPageState({ isModalOpen: false });
    renderWithProviders(<VenueLayoutReservationTabPanel page={page as never} />);
    await user.click(screen.getByRole("button", { name: "Edit home section" }));
    expect(page.openModal).toHaveBeenCalled();
  });

  it("shows loading state for home preview", () => {
    const page = createMockVenueLayoutPromoPageState({ isLoading: true });
    renderWithProviders(<VenueLayoutReservationTabPanel page={page as never} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByTestId("promo-preview")).not.toBeInTheDocument();
  });

  it("shows edit modal when open", () => {
    const page = createMockVenueLayoutPromoPageState({ isModalOpen: true });
    renderWithProviders(<VenueLayoutReservationTabPanel page={page as never} />);
    expect(screen.getByTestId("promo-edit-modal")).toBeInTheDocument();
  });
});
