/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "@/hooks/use-toast";
import {
  makeAdminVenueConfig,
  makeReservationEventTemplate,
} from "../test/fixtures/onComingEvents.fixture";
import { FIXTURE_EVENT_ID, FIXTURE_TEMPLATE_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { UpcomingVenueConfigPanel } from "./UpcomingVenueConfigPanel";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/features/admin/events/lib/eventsAuth", () => ({
  getEventsBearerToken: () => "events-token",
}));

vi.mock("../reservation-events/hooks/useReservationEventTemplateOptions", () => ({
  useReservationEventTemplateOptions: () => ({
    templates: [makeReservationEventTemplate()],
    loading: false,
  }),
}));

const fetchAdminVenueConfig = vi.fn();
const patchAdminVenueConfig = vi.fn();
const postAdminRegenerateClassSessions = vi.fn();

vi.mock("../services/patchAdminVenueConfig", () => ({
  fetchAdminVenueConfig: (...args: unknown[]) => fetchAdminVenueConfig(...args),
  patchAdminVenueConfig: (...args: unknown[]) => patchAdminVenueConfig(...args),
}));

vi.mock("../services/postAdminRegenerateClassSessions", () => ({
  postAdminRegenerateClassSessions: (...args: unknown[]) =>
    postAdminRegenerateClassSessions(...args),
}));

describe("UpcomingVenueConfigPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminVenueConfig.mockResolvedValue({
      ok: true,
      config: makeAdminVenueConfig({
        reservationEventTemplateId: FIXTURE_TEMPLATE_ID,
      }),
    });
    patchAdminVenueConfig.mockResolvedValue({
      ok: true,
      config: makeAdminVenueConfig(),
    });
    postAdminRegenerateClassSessions.mockResolvedValue({ ok: true });
  });

  it("renders reservation schedule section after load", async () => {
    renderWithProviders(
      <UpcomingVenueConfigPanel eventId={FIXTURE_EVENT_ID} />,
    );
    expect(
      screen.getByRole("heading", { name: "RESERVATION SCHEDULE" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Currently linked:/)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Apply schedule" }),
    ).toBeInTheDocument();
  });

  it("applies schedule and toasts success", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UpcomingVenueConfigPanel eventId={FIXTURE_EVENT_ID} />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Apply schedule" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "Apply schedule" }));
    await waitFor(() => {
      expect(patchAdminVenueConfig).toHaveBeenCalled();
    });
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Reservation schedule linked" }),
    );
  });
});
