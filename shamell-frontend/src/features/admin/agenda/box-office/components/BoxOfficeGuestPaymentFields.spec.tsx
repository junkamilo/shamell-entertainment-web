/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { BoxOfficeGuestPaymentFields } from "./BoxOfficeGuestPaymentFields";

function makeProps(overrides: Partial<Parameters<typeof BoxOfficeGuestPaymentFields>[0]> = {}) {
  return {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    paymentMethod: "cash" as const,
    cashConfirmed: false,
    onNameChange: vi.fn(),
    onEmailChange: vi.fn(),
    onPhoneChange: vi.fn(),
    onPaymentMethodChange: vi.fn(),
    onCashConfirmedChange: vi.fn(),
    ...overrides,
  };
}

describe("BoxOfficeGuestPaymentFields", () => {
  it("forwards typed name and email to the change handlers", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithProviders(<BoxOfficeGuestPaymentFields {...props} />);

    await user.type(screen.getByLabelText(/full name/i), "J");
    expect(props.onNameChange).toHaveBeenCalledWith("J");

    await user.type(screen.getByLabelText(/^email$/i), "j");
    expect(props.onEmailChange).toHaveBeenCalledWith("j");
  });

  it("forwards typed phone to the change handler", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithProviders(<BoxOfficeGuestPaymentFields {...props} />);

    await user.type(screen.getByLabelText(/phone/i), "5");
    expect(props.onPhoneChange).toHaveBeenCalledWith("5");
  });

  it("shows the cash confirmation checkbox only when paymentMethod is cash", () => {
    const { rerender } = renderWithProviders(
      <BoxOfficeGuestPaymentFields {...makeProps({ paymentMethod: "cash" })} />,
    );
    expect(
      screen.getByText(/i confirm cash payment was received/i),
    ).toBeInTheDocument();

    rerender(
      <BoxOfficeGuestPaymentFields {...makeProps({ paymentMethod: "stripe" })} />,
    );
    expect(
      screen.queryByText(/i confirm cash payment was received/i),
    ).not.toBeInTheDocument();
  });

  it("toggles payment method and cash confirmation", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderWithProviders(<BoxOfficeGuestPaymentFields {...props} />);

    await user.click(screen.getByRole("radio", { name: /stripe/i }));
    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("stripe");

    await user.click(screen.getByRole("checkbox"));
    expect(props.onCashConfirmedChange).toHaveBeenCalledWith(true);
  });
});
