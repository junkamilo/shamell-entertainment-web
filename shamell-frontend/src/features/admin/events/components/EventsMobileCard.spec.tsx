/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventsMobileCard from "./EventsMobileCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof EventsMobileCard>> = {},
) {
  const item = makeAdminEvent({ isActive: true });
  const props: React.ComponentProps<typeof EventsMobileCard> = {
    item,
    togglingId: null,
    deactivateBlocked: false,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<EventsMobileCard {...props} />),
    props,
    item,
  };
}

describe("EventsMobileCard", () => {
  it("renders event heading, type, and Active status", () => {
    const { item } = renderCard();
    expect(
      screen.getByText("An elegant private wedding package with full staging."),
    ).toBeInTheDocument();
    expect(screen.getByText(item.eventTypeName)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls View / Edit / Delete callbacks from aria buttons", async () => {
    const user = userEvent.setup();
    const { props } = renderCard();

    await user.click(screen.getByRole("button", { name: "View event" }));
    expect(props.onView).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Edit event" }));
    expect(props.onEdit).toHaveBeenCalledOnce();

    await user.click(
      screen.getByRole("button", { name: "Delete event permanently" }),
    );
    expect(props.onDelete).toHaveBeenCalledOnce();
  });

  it("shows Hidden for inactive items", () => {
    const inactive = makeAdminEvent({
      isActive: false,
      description: "Corporate gala night with VIP tables.",
    });
    renderCard({ item: inactive });
    expect(screen.getByText("Hidden")).toBeInTheDocument();
    expect(
      screen.getByText("Corporate gala night with VIP tables."),
    ).toBeInTheDocument();
  });

  it("shows item count and formatted price", () => {
    renderCard();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("2,500")).toBeInTheDocument();
  });
});
