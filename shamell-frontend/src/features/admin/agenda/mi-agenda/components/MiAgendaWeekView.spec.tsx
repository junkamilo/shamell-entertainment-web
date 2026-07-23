/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeByDateMap,
  makeEnrichedBooking,
} from "../test/fixtures/miAgenda.fixture";
import { FIXTURE_BOOKING_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import MiAgendaWeekView from "./MiAgendaWeekView";

const weekDays = [
  "2026-07-20",
  "2026-07-21",
  "2026-07-22",
  "2026-07-23",
  "2026-07-24",
  "2026-07-25",
  "2026-07-26",
];

describe("MiAgendaWeekView", () => {
  it("renders one column per week day", () => {
    renderWithProviders(
      <MiAgendaWeekView
        weekDays={weekDays}
        byDate={new Map()}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByText("No events")).toHaveLength(7);
    expect(screen.getByText(/MON/)).toBeInTheDocument();
  });

  it("shows events for matching dates and wires select", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <MiAgendaWeekView
        weekDays={weekDays}
        byDate={makeByDateMap([["2026-07-22", [makeEnrichedBooking()]]])}
        selectedId={null}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("Ada Guest")).toBeInTheDocument();
    await user.click(screen.getByText("Ada Guest"));
    expect(onSelect).toHaveBeenCalledWith(FIXTURE_BOOKING_ID);
  });
});
