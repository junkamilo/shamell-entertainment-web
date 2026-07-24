/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeOccasionTypeItem } from "../test/fixtures/occasionTypes.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import OccasionTypesMobileCard from "./OccasionTypesMobileCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof OccasionTypesMobileCard>> = {},
) {
  const item = makeOccasionTypeItem();
  const props: React.ComponentProps<typeof OccasionTypesMobileCard> = {
    item,
    deactivateBlocked: false,
    isToggling: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<OccasionTypesMobileCard {...props} />),
    props,
    item,
  };
}

describe("OccasionTypesMobileCard", () => {
  it("renders name and ACTIVE status", () => {
    const { item } = renderCard();
    expect(screen.getByRole("heading", { name: item.name })).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("shows INACTIVE when inactive", () => {
    renderCard({ item: makeOccasionTypeItem({ isActive: false }) });
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });

  it("calls edit and delete", async () => {
    const user = userEvent.setup();
    const { props, item } = renderCard();
    await user.click(screen.getByRole("button", { name: `Edit ${item.name}` }));
    await user.click(screen.getByRole("button", { name: `Delete ${item.name}` }));
    expect(props.onEdit).toHaveBeenCalledWith(item);
    expect(props.onDelete).toHaveBeenCalledWith(item);
  });
});
