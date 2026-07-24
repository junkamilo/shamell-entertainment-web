/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeVenueTable } from "../test/fixtures/venueTables.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import VenueTablesMobileCard from "./VenueTablesMobileCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof VenueTablesMobileCard>> = {},
) {
  const item = makeVenueTable();
  const props: React.ComponentProps<typeof VenueTablesMobileCard> = {
    item,
    onEdit: vi.fn(),
    onDeactivate: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<VenueTablesMobileCard {...props} />), props, item };
}

describe("VenueTablesMobileCard", () => {
  it("renders table label, size, chairs, and combo price", () => {
    const { item } = renderCard();
    expect(screen.getByText(item.displayLabel!)).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText(String(item.includedChairs))).toBeInTheDocument();
    expect(screen.getByText("$250")).toBeInTheDocument();
  });

  it("calls onEdit and onDeactivate", async () => {
    const user = userEvent.setup();
    const { props } = renderCard();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(props.onEdit).toHaveBeenCalled();
    expect(props.onDeactivate).toHaveBeenCalled();
  });
});
