/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import {
  makeByDateMap,
  makeEnrichedBooking,
} from "../test/fixtures/miAgenda.fixture";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_BOOKING_ID_2,
  FIXTURE_BOOKING_ID_3,
  FIXTURE_BOOKING_ID_4,
} from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import MiAgendaMonthView from "./MiAgendaMonthView";

describe("MiAgendaMonthView", () => {
  it("renders a cell for each monthGrid day", () => {
    const monthGrid = ["2026-07-01", "2026-07-02", "2026-07-03"];
    renderWithProviders(
      <MiAgendaMonthView
        anchorIso="2026-07-15"
        monthGrid={monthGrid}
        byDate={new Map()}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByText("No events")).toHaveLength(3);
  });

  it("shows +N more when a day has more than 3 events", () => {
    const rows = [
      makeEnrichedBooking({ id: FIXTURE_BOOKING_ID, guestFullName: "A" }),
      makeEnrichedBooking({ id: FIXTURE_BOOKING_ID_2, guestFullName: "B" }),
      makeEnrichedBooking({ id: FIXTURE_BOOKING_ID_3, guestFullName: "C" }),
      makeEnrichedBooking({ id: FIXTURE_BOOKING_ID_4, guestFullName: "D" }),
    ];
    renderWithProviders(
      <MiAgendaMonthView
        anchorIso="2026-07-15"
        monthGrid={["2026-07-22"]}
        byDate={makeByDateMap([["2026-07-22", rows]])}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("+1 more…")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("D")).not.toBeInTheDocument();
  });
});
