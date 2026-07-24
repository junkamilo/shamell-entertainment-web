/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { VenueLayoutPromoSectionTabs } from "./VenueLayoutPromoSectionTabs";

describe("VenueLayoutPromoSectionTabs", () => {
  it("renders section tabs with reservation selected", () => {
    renderWithProviders(
      <VenueLayoutPromoSectionTabs
        activeTab="reservation"
        onTabChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("tablist", { name: "On Coming Events sections" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reservation event" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("calls onTabChange when a tab is clicked", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    renderWithProviders(
      <VenueLayoutPromoSectionTabs
        activeTab="reservation"
        onTabChange={onTabChange}
      />,
    );
    await user.click(screen.getByRole("tab", { name: "Home promo preview" }));
    expect(onTabChange).toHaveBeenCalledWith("home-promo");
  });
});
