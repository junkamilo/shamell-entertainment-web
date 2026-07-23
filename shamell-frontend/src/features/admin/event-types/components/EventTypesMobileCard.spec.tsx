/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeEventTypeItem } from "../test/fixtures/eventTypes.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventTypesMobileCard from "./EventTypesMobileCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof EventTypesMobileCard>> = {},
) {
  const item = makeEventTypeItem({ isActive: true });
  const props: React.ComponentProps<typeof EventTypesMobileCard> = {
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
    ...renderWithProviders(<EventTypesMobileCard {...props} />),
    props,
    item,
  };
}

describe("EventTypesMobileCard", () => {
  it("renders the event type name and ACTIVE status", () => {
    const { item } = renderCard();
    expect(screen.getByText(item.name)).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("calls Edit and Delete callbacks", async () => {
    const user = userEvent.setup();
    const { props, item } = renderCard();

    await user.click(screen.getByRole("button", { name: `Edit ${item.name}` }));
    expect(props.onEdit).toHaveBeenCalledWith(item);

    await user.click(screen.getByRole("button", { name: `Delete ${item.name}` }));
    expect(props.onDelete).toHaveBeenCalledWith(item);
  });

  it("shows INACTIVE for inactive items", () => {
    const inactive = makeEventTypeItem({ isActive: false, name: "Corporate gala" });
    renderCard({ item: inactive });
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Corporate gala")).toBeInTheDocument();
  });
});
