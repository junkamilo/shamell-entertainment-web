/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeEnrichedBooking } from "../test/fixtures/miAgenda.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/lib/adminBookingDisplay", () => ({
  bookingServiceDisplayLine: () => "Performance · package",
  bookingServiceChip: () => "BOOKING",
}));

import MiAgendaEventDetailsRead from "./MiAgendaEventDetailsRead";

describe("MiAgendaEventDetailsRead", () => {
  it("shows guest, status, times, and service", () => {
    renderWithProviders(
      <MiAgendaEventDetailsRead selected={makeEnrichedBooking()} />,
    );
    expect(screen.getByText("Ada Guest")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
    expect(screen.getByText(/10:00 - 11:30 · 1h 30m/)).toBeInTheDocument();
    expect(screen.getByText("Performance · package")).toBeInTheDocument();
    expect(screen.getByText("Private class")).toBeInTheDocument();
  });

  it("falls back to Location TBD and hides notes when empty", () => {
    renderWithProviders(
      <MiAgendaEventDetailsRead
        selected={makeEnrichedBooking({ location: "", notes: "" })}
      />,
    );
    expect(screen.getByText("Location TBD")).toBeInTheDocument();
    expect(screen.queryByText("NOTES")).not.toBeInTheDocument();
  });

  it("renders notes when present", () => {
    renderWithProviders(
      <MiAgendaEventDetailsRead
        selected={makeEnrichedBooking({ notes: "Bring shoes" })}
      />,
    );
    expect(screen.getByText("NOTES")).toBeInTheDocument();
    expect(screen.getByText("Bring shoes")).toBeInTheDocument();
  });
});
