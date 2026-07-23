/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeEnrichedBooking } from "../test/fixtures/miAgenda.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import MiAgendaEventListItem from "./MiAgendaEventListItem";

describe("MiAgendaEventListItem", () => {
  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const row = makeEnrichedBooking();
    renderWithProviders(
      <MiAgendaEventListItem row={row} selectedId={null} onSelect={onSelect} />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(row.id);
  });

  it("shows duration and event type in day variant", () => {
    renderWithProviders(
      <MiAgendaEventListItem
        row={makeEnrichedBooking()}
        selectedId={null}
        onSelect={vi.fn()}
        variant="day"
      />,
    );
    expect(screen.getByText(/10:00 - 11:30/)).toBeInTheDocument();
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
    expect(screen.getByText("Ada Guest")).toBeInTheDocument();
    expect(screen.getByText("Private class")).toBeInTheDocument();
  });

  it("shows compact content in month variant", () => {
    renderWithProviders(
      <MiAgendaEventListItem
        row={makeEnrichedBooking()}
        selectedId={null}
        onSelect={vi.fn()}
        variant="month"
      />,
    );
    expect(screen.getByText("10:00 - 11:30")).toBeInTheDocument();
    expect(screen.getByText("Ada Guest")).toBeInTheDocument();
    expect(screen.queryByText("Private class")).not.toBeInTheDocument();
  });
});
