/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import {
  makeAdminBookingRow,
  makeContactRequest,
  makeContactRow,
} from "../../test/fixtures/peticiones.fixture";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("../../lib/peticionesContactUtils", () => ({
  contactIsBookingInquiry: () => false,
  contactIsConciergeInquiry: () => false,
}));

import PeticionesRequestCardActions from "./PeticionesRequestCardActions";

describe("PeticionesRequestCardActions", () => {
  it("wires reserve / cancel / delete for a contact row", async () => {
    const user = userEvent.setup();
    const contact = makeContactRequest();
    const contactRow = makeContactRow({ contact });
    const onReserveFromContact = vi.fn();
    const onCancel = vi.fn();
    const onRemove = vi.fn();
    renderWithProviders(
      <PeticionesRequestCardActions
        contactRow={contactRow}
        contact={contact}
        booking={null}
        manualAgendarHref="/admin/agenda/agendar"
        busy={false}
        reserving={false}
        isCancelled
        onReserveFromContact={onReserveFromContact}
        onCancel={onCancel}
        onCancelBooking={vi.fn()}
        onRemove={onRemove}
        onRemoveBooking={vi.fn()}
        onOpenPaymentLink={vi.fn()}
        onSendBalanceLink={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Reserve" }));
    expect(onReserveFromContact).toHaveBeenCalledWith(contact);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/admin/agenda/agendar",
    );
  });

  it("wires payment and balance links for a booking", async () => {
    const user = userEvent.setup();
    const booking = makeAdminBookingRow({
      quoteSentAt: null,
      depositPaidAt: "2026-07-21T12:00:00.000Z",
      balancePaidAt: null,
      status: "PENDING",
    });
    const onOpenPaymentLink = vi.fn();
    const onSendBalanceLink = vi.fn();
    const onCancelBooking = vi.fn();
    renderWithProviders(
      <PeticionesRequestCardActions
        contactRow={null}
        contact={null}
        booking={booking}
        manualAgendarHref="/admin/agenda/agendar?edit=1"
        busy={false}
        reserving={false}
        isCancelled={false}
        onReserveFromContact={vi.fn()}
        onCancel={vi.fn()}
        onCancelBooking={onCancelBooking}
        onRemove={vi.fn()}
        onRemoveBooking={vi.fn()}
        onOpenPaymentLink={onOpenPaymentLink}
        onSendBalanceLink={onSendBalanceLink}
      />,
    );
    expect(screen.queryByRole("button", { name: "Reserve" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send payment link" }));
    expect(onOpenPaymentLink).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Send balance link" }));
    expect(onSendBalanceLink).toHaveBeenCalledWith(booking);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancelBooking).toHaveBeenCalledWith(booking);
  });
});
