/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeCatalogTableItem } from "../../test/fixtures/onComingEvents.fixture";
import {
  venueCashReservationHandler,
  venueCheckoutSessionHandler,
} from "../../test/mocks/handlers";
import { FIXTURE_LAYOUT_ITEM_ID } from "../../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import AdminVenueReservationModal from "./AdminVenueReservationModal";

describe("AdminVenueReservationModal", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    server.use(venueCheckoutSessionHandler(), venueCashReservationHandler());
  });

  it("renders reservation form for a catalog table", () => {
    const item = makeCatalogTableItem();
    renderWithProviders(
      <AdminVenueReservationModal
        item={item}
        tableBundlePrice={250}
        eventDateIso="2030-08-01T20:00:00.000Z"
        upcomingEventSlug="gala-night"
        onClose={vi.fn()}
        onReserved={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Reserve Large/i })).toBeInTheDocument();
  });

  it("submits cash reservation via MSW", async () => {
    const user = userEvent.setup();
    const onReserved = vi.fn();
    const onClose = vi.fn();
    const item = makeCatalogTableItem();
    renderWithProviders(
      <AdminVenueReservationModal
        item={item}
        tableBundlePrice={250}
        eventDateIso="2030-08-01T20:00:00.000Z"
        upcomingEventSlug="gala-night"
        onClose={onClose}
        onReserved={onReserved}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /Full name/i }), "Ada Lovelace");
    await user.type(screen.getByRole("textbox", { name: /^Email$/i }), "ada@example.com");
    await user.click(screen.getByRole("radio", { name: /Cash \(reserve immediately\)/i }));
    await user.click(
      screen.getByLabelText(/I confirm cash payment was received from the guest/i),
    );
    await user.click(screen.getByRole("button", { name: /Confirm cash reservation/i }));

    await waitFor(() =>
      expect(onReserved).toHaveBeenCalledWith(FIXTURE_LAYOUT_ITEM_ID, "Ada Lovelace"),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("shows validation error when cash is not confirmed", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AdminVenueReservationModal
        item={makeCatalogTableItem()}
        tableBundlePrice={250}
        eventDateIso={null}
        upcomingEventSlug={null}
        onClose={vi.fn()}
        onReserved={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("textbox", { name: /Full name/i }), "Ada Lovelace");
    await user.type(screen.getByRole("textbox", { name: /^Email$/i }), "ada@example.com");
    await user.click(screen.getByRole("radio", { name: /Cash \(reserve immediately\)/i }));
    await user.click(screen.getByRole("button", { name: /Confirm cash reservation/i }));
    expect(
      screen.getByText(/Confirm that cash payment was received/i),
    ).toBeInTheDocument();
  });

  it("handles checkout API errors", async () => {
    server.use(
      http.post("*/api/v1/venue-reservations/admin/checkout-session", () =>
        HttpResponse.json({ message: "Stripe unavailable" }, { status: 502 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <AdminVenueReservationModal
        item={makeCatalogTableItem()}
        tableBundlePrice={250}
        eventDateIso={null}
        upcomingEventSlug={null}
        onClose={vi.fn()}
        onReserved={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("textbox", { name: /Full name/i }), "Ada Lovelace");
    await user.type(screen.getByRole("textbox", { name: /^Email$/i }), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /Send payment link/i }));
    await waitFor(() =>
      expect(screen.getByText(/Stripe unavailable/i)).toBeInTheDocument(),
    );
  });
});
