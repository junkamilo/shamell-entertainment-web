/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import {
  makeRecurringReservationEventTemplate,
  makeReservationEventTemplate,
} from "../../test/fixtures/onComingEvents.fixture";
import { FIXTURE_TEMPLATE_ID } from "../../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("./ReservationEventFormModal", () => ({
  ReservationEventFormModal: ({
    isOpen,
    editing,
    onClose,
    onSubmit,
  }: {
    isOpen: boolean;
    editing: { name: string } | null;
    onClose: () => void;
    onSubmit: (body: { name: string }) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={editing ? "Edit reservation event" : "New reservation event"}>
        <button type="button" onClick={onClose}>
          Close modal
        </button>
        <button type="button" onClick={() => onSubmit({ name: "New Event" })}>
          Submit modal
        </button>
      </div>
    ) : null,
}));

import { ReservationEventsPanel } from "./ReservationEventsPanel";

describe("ReservationEventsPanel", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads and lists reservation events", async () => {
    renderWithProviders(<ReservationEventsPanel />);
    expect(await screen.findByText("Saturday Gala")).toBeInTheDocument();
    expect(screen.getByText("Weekly Bachata")).toBeInTheDocument();
    expect(screen.getByText("FIXED")).toBeInTheDocument();
    expect(screen.getByText("RECURRING")).toBeInTheDocument();
  });

  it("shows empty state when there are no templates", async () => {
    const { server } = await import("@/test/server");
    const { http, HttpResponse } = await import("msw");
    server.use(
      http.get("*/api/v1/reservation-event-templates/admin", () => HttpResponse.json([])),
    );
    renderWithProviders(<ReservationEventsPanel />);
    expect(
      await screen.findByText(/No reservation events yet/),
    ).toBeInTheDocument();
  });

  it("opens create modal from New reservation event button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReservationEventsPanel />);
    await screen.findByText("Saturday Gala");
    await user.click(screen.getByRole("button", { name: /New reservation event/i }));
    expect(
      screen.getByRole("dialog", { name: "New reservation event" }),
    ).toBeInTheDocument();
  });

  it("opens edit modal from edit button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReservationEventsPanel />);
    await screen.findByText("Saturday Gala");
    await user.click(screen.getByRole("button", { name: "Edit Saturday Gala" }));
    expect(
      screen.getByRole("dialog", { name: "Edit reservation event" }),
    ).toBeInTheDocument();
  });

  it("toasts on load failure", async () => {
    const { server } = await import("@/test/server");
    const { http, HttpResponse } = await import("msw");
    server.use(
      http.get("*/api/v1/reservation-event-templates/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    renderWithProviders(<ReservationEventsPanel />);
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Could not load",
        }),
      ),
    );
  });

  it("creates a template from the modal submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReservationEventsPanel />);
    await screen.findByText("Saturday Gala");
    await user.click(screen.getByRole("button", { name: /New reservation event/i }));
    await user.click(screen.getByRole("button", { name: "Submit modal" }));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Reservation event created" }),
      ),
    );
  });

  it("deletes a template after confirm", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderWithProviders(<ReservationEventsPanel />);
    await screen.findByText("Saturday Gala");
    await user.click(screen.getByRole("button", { name: "Delete Saturday Gala" }));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Deleted" })),
    );
    confirmSpy.mockRestore();
  });
});
