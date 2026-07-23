/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventsViewOverlay from "./EventsViewOverlay";

describe("EventsViewOverlay", () => {
  it("renders null without viewEvent", () => {
    const { container } = renderWithProviders(
      <EventsViewOverlay viewEvent={null} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows QUICK LOOK and event details", () => {
    const event = makeAdminEvent();
    renderWithProviders(
      <EventsViewOverlay viewEvent={event} onClose={vi.fn()} />,
    );

    expect(screen.getByText("QUICK LOOK")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "An elegant private wedding package with full staging.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(event.eventTypeName)).toBeInTheDocument();
  });

  it("calls onClose from Close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <EventsViewOverlay viewEvent={makeAdminEvent()} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
