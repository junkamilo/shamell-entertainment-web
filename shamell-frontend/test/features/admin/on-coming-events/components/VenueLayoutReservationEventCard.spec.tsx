/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "@/hooks/use-toast";
import { makeVenueLayoutSettings } from "@test/features/admin/on-coming-events/support/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "@test/features/admin/on-coming-events/support/helpers/renderWithProviders";
import { VenueLayoutReservationEventCard } from "@/features/admin/on-coming-events/components/VenueLayoutReservationEventCard";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  getAdminBearerToken: () => "admin-token",
}));

vi.mock("@/features/admin/on-coming-events/components/VenueLayoutReservationPickers", () => ({
  VenueLayoutReservationPickers: () => (
    <div data-testid="reservation-pickers" />
  ),
}));

const patchAdminVenueLayoutSettings = vi.fn();

vi.mock("@/features/admin/on-coming-events/services/patchAdminVenueLayoutSettings", () => ({
  patchAdminVenueLayoutSettings: (...args: unknown[]) =>
    patchAdminVenueLayoutSettings(...args),
}));

describe("VenueLayoutReservationEventCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patchAdminVenueLayoutSettings.mockResolvedValue({
      ok: true,
      settings: makeVenueLayoutSettings({ reservationEventLabel: "Gala Night" }),
    });
  });

  it("renders event label field and save button", () => {
    renderWithProviders(
      <VenueLayoutReservationEventCard
        settings={makeVenueLayoutSettings()}
        onSaved={vi.fn()}
      />,
    );
    expect(
      screen.getByLabelText("Event label (shown on site)"),
    ).toHaveValue("Saturday Gala");
    expect(screen.getByRole("button", { name: "Save event" })).toBeInTheDocument();
    expect(screen.getByTestId("reservation-pickers")).toBeInTheDocument();
  });

  it("saves event label and calls onSaved", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithProviders(
      <VenueLayoutReservationEventCard
        settings={makeVenueLayoutSettings()}
        onSaved={onSaved}
      />,
    );
    const input = screen.getByLabelText("Event label (shown on site)");
    await user.clear(input);
    await user.type(input, "Gala Night");
    await user.click(screen.getByRole("button", { name: "Save event" }));
    await waitFor(() => {
      expect(patchAdminVenueLayoutSettings).toHaveBeenCalled();
    });
    expect(onSaved).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Reservation event saved" }),
    );
  });
});
