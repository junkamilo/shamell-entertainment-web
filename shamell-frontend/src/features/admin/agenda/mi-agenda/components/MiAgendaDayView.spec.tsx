/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeEnrichedBooking,
  makeEnrichedBookingsForDay,
} from "../test/fixtures/miAgenda.fixture";
import { FIXTURE_BOOKING_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import MiAgendaDayView from "./MiAgendaDayView";

describe("MiAgendaDayView", () => {
  it("shows empty state", () => {
    renderWithProviders(
      <MiAgendaDayView
        anchorIso="2026-07-22"
        rows={[]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("No events")).toBeInTheDocument();
  });

  it("renders rows and wires selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const rows = makeEnrichedBookingsForDay("2026-07-22", 2);
    renderWithProviders(
      <MiAgendaDayView
        anchorIso="2026-07-22"
        rows={rows}
        selectedId={null}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("Guest 1")).toBeInTheDocument();
    expect(screen.getByText("Guest 2")).toBeInTheDocument();
    await user.click(screen.getByText("Guest 1"));
    expect(onSelect).toHaveBeenCalledWith(FIXTURE_BOOKING_ID);
  });

  it("formats the day heading from anchorIso", () => {
    renderWithProviders(
      <MiAgendaDayView
        anchorIso="2026-07-22"
        rows={[makeEnrichedBooking()]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(/Jul/)).toBeInTheDocument();
  });
});
