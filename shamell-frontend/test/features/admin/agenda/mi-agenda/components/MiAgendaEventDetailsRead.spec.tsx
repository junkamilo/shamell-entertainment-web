/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeEnrichedBooking } from "@test/features/admin/agenda/mi-agenda/support/fixtures/miAgenda.fixture";
import { renderWithProviders } from "@test/features/admin/agenda/mi-agenda/support/helpers/renderWithProviders";

vi.mock("@/lib/agenda/adminBookingDisplay", () => ({
  bookingServiceDisplayLine: () => "Performance · package",
  bookingServiceChip: () => "BOOKING",
}));

import MiAgendaEventDetailsRead from "@/features/admin/agenda/mi-agenda/components/MiAgendaEventDetailsRead";

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
