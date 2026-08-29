/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createVenueLayoutItemModalProps } from "../test/helpers/mockOnComingEventsPage";
import { makeVenueTableApiRow } from "../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const checkoutMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/stripe", () => ({
  StripeCheckoutHost: ({ clientSecret }: { clientSecret: string }) => (
    <div data-testid="stripe-checkout">{clientSecret}</div>
  ),
}));

vi.mock("../services/createVenueCheckoutSession", () => ({
  createVenueCheckoutSession: (...args: unknown[]) => checkoutMock(...args),
}));

import VenueLayoutItemModal from "./VenueLayoutItemModal";

const chairItem = {
  id: "chair-1",
  kind: "standalone_chair" as const,
  venueStandaloneChairId: "chair-cfg-1",
  chairName: "Chair A",
  x: 10,
  y: 20,
  rotation: 0,
};

describe("VenueLayoutItemModal", () => {
  beforeEach(() => {
    checkoutMock.mockReset();
  });

  it("renders table summary and reserve action", async () => {
    const props = createVenueLayoutItemModalProps();
    renderWithProviders(<VenueLayoutItemModal {...props} />);
    expect(screen.getByRole("heading", { name: "Large" })).toBeInTheDocument();
    expect(screen.getByText("Saturday Gala")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /reserve/i }));
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it("renders a table without a bundle price", () => {
    renderWithProviders(
      <VenueLayoutItemModal
        {...createVenueLayoutItemModalProps({
          tableConfig: { ...makeVenueTableApiRow(), bundlePrice: undefined as never },
        })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Large" })).toBeInTheDocument();
  });

  it("shows reserved message when seat is taken", () => {
    const props = createVenueLayoutItemModalProps({ isReserved: true });
    renderWithProviders(<VenueLayoutItemModal {...props} />);
    expect(
      screen.getByText(/this seat is already reserved for the event/i),
    ).toBeInTheDocument();
  });

  it("shows reservations closed on the summary CTA", () => {
    renderWithProviders(
      <VenueLayoutItemModal
        {...createVenueLayoutItemModalProps({ reservationsOpen: false })}
      />,
    );
    expect(
      screen.getByRole("button", { name: /reservations closed/i }),
    ).toBeDisabled();
  });

  it("checks out a table and shows stripe", async () => {
    const user = userEvent.setup();
    checkoutMock.mockResolvedValue({
      ok: true,
      clientSecret: "cs_table",
      reservationId: "r1",
    });
    const props = createVenueLayoutItemModalProps();
    renderWithProviders(<VenueLayoutItemModal {...props} />);
    await user.click(screen.getByRole("button", { name: /reserve/i }));
    await user.type(screen.getByLabelText(/full name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stripe-checkout")).toHaveTextContent("cs_table");
    });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it("shows checkout errors", async () => {
    const user = userEvent.setup();
    checkoutMock.mockResolvedValue({ ok: false, message: "Taken" });
    const props = createVenueLayoutItemModalProps();
    renderWithProviders(<VenueLayoutItemModal {...props} />);
    await user.click(screen.getByRole("button", { name: /reserve/i }));
    fireEvent.submit(screen.getByRole("button", { name: /continue to payment/i }).closest("form")!);
    expect(screen.getByText(/name and email are required/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/full name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText("Taken")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByRole("button", { name: /reserve/i })).toBeInTheDocument();
  });

  it("blocks checkout when reservations are closed after opening details", async () => {
    const user = userEvent.setup();
    const props = createVenueLayoutItemModalProps({ reservationsOpen: true });
    const { rerender } = renderWithProviders(<VenueLayoutItemModal {...props} />);
    await user.click(screen.getByRole("button", { name: /reserve/i }));
    rerender(
      <VenueLayoutItemModal {...props} reservationsOpen={false} />,
    );
    await user.type(screen.getByLabelText(/full name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(screen.getByText(/reservations closed/i)).toBeInTheDocument();
  });

  it("renders a chair, date fallbacks, close, and escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <VenueLayoutItemModal
        {...createVenueLayoutItemModalProps({
          item: chairItem,
          tableConfig: null,
          eventLabel: "  ",
          eventDateIso: "2030-08-01T20:00:00.000Z",
          displayLabel: " Chair A ",
          onClose,
        })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Chair A" })).toBeInTheDocument();
    expect(screen.getByText(/individual seat/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Close" })[1]!);
    expect(onClose).toHaveBeenCalled();

    const onClose2 = vi.fn();
    renderWithProviders(
      <VenueLayoutItemModal
        {...createVenueLayoutItemModalProps({
          eventLabel: null,
          eventDateIso: null,
          onClose: onClose2,
        })}
      />,
    );
    expect(screen.getByText("Date to be announced")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose2).toHaveBeenCalled();
  });

  it("uses table size fallback when the display label is blank and checks out a chair", async () => {
    const user = userEvent.setup();
    checkoutMock.mockResolvedValue({
      ok: true,
      clientSecret: "cs_chair",
      reservationId: "r2",
    });
    renderWithProviders(
      <VenueLayoutItemModal
        {...createVenueLayoutItemModalProps({
          item: chairItem,
          tableConfig: null,
          displayLabel: "",
        })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Standalone chair" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reserve/i }));
    await user.type(screen.getByLabelText(/full name/i), "Ada");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stripe-checkout")).toHaveTextContent("cs_chair");
    });
    expect(checkoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "standalone_chair",
        venueTableConfigId: undefined,
        customerPhone: undefined,
      }),
    );
  });

  it("uses the table size title when displayLabel is omitted", () => {
    renderWithProviders(
      <VenueLayoutItemModal {...createVenueLayoutItemModalProps({ displayLabel: null })} />,
    );
    expect(screen.getByRole("heading", { name: /large/i })).toBeInTheDocument();
  });

  it("falls back to the raw date when locale formatting throws", () => {
    const spy = vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(() => {
      throw new Error("bad date");
    });
    renderWithProviders(
      <VenueLayoutItemModal
        {...createVenueLayoutItemModalProps({
          eventLabel: null,
          eventDateIso: "2030-08-01T20:00:00.000Z",
        })}
      />,
    );
    expect(screen.getByText("2030-08-01T20:00:00.000Z")).toBeInTheDocument();
    spy.mockRestore();
  });
});
