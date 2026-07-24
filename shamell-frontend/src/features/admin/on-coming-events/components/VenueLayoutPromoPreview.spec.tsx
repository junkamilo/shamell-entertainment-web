/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeVenueLayoutSettings } from "../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { VenueLayoutPromoPreview } from "./VenueLayoutPromoPreview";

describe("VenueLayoutPromoPreview", () => {
  it("renders promo title and description from settings", () => {
    renderWithProviders(
      <VenueLayoutPromoPreview
        settings={makeVenueLayoutSettings()}
        onEdit={vi.fn()}
        embedded
      />,
    );
    expect(screen.getByText("On Coming Events")).toBeInTheDocument();
    expect(
      screen.getByText("Reserve seats for our next night."),
    ).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderWithProviders(
      <VenueLayoutPromoPreview
        settings={makeVenueLayoutSettings()}
        onEdit={onEdit}
        embedded
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Edit home section" }),
    );
    expect(onEdit).toHaveBeenCalled();
  });
});
