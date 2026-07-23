/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventsTable from "./EventsTable";

function renderTable(
  overrides: Partial<React.ComponentProps<typeof EventsTable>> = {},
) {
  const item = makeAdminEvent({ isActive: true });
  const props: React.ComponentProps<typeof EventsTable> = {
    events: [item],
    togglingId: null,
    cannotDeactivate: () => false,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<EventsTable {...props} />),
    props,
    item,
  };
}

describe("EventsTable", () => {
  it("renders event heading, type, and Active status", () => {
    const { item } = renderTable();
    expect(
      screen.getByText("An elegant private wedding package with full staging."),
    ).toBeInTheDocument();
    expect(screen.getByText(item.eventTypeName)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls View / Edit / Delete handlers from aria buttons", async () => {
    const user = userEvent.setup();
    const { props, item } = renderTable();

    await user.click(screen.getByRole("button", { name: "View event" }));
    expect(props.onView).toHaveBeenCalledWith(item);

    await user.click(screen.getByRole("button", { name: "Edit event" }));
    expect(props.onEdit).toHaveBeenCalledWith(item);

    await user.click(
      screen.getByRole("button", { name: "Delete event permanently" }),
    );
    expect(props.onDelete).toHaveBeenCalledWith(item);
  });

  it("shows Hidden status for inactive rows", () => {
    const inactive = makeAdminEvent({
      isActive: false,
      description: "Corporate gala night with VIP tables.",
    });
    renderTable({ events: [inactive] });
    expect(screen.getByText("Hidden")).toBeInTheDocument();
  });
});
