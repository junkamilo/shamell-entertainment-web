/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { createMockPrivateClassFormReturn } from "../test/helpers/mockBookClassFormState";

const usePrivateClassFormMock = vi.fn();

vi.mock("../hooks/usePrivateClassForm", () => ({
  usePrivateClassForm: () => usePrivateClassFormMock(),
}));

vi.mock("@/features/contacto/components/ContactDatePickerModal", () => ({
  default: ({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (iso: string) => void;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={() => onConfirm("2030-06-15")}>
          pick-date
        </button>
        <button type="button" onClick={onClose}>
          close-date
        </button>
      </div>
    ) : null,
}));

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: ({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (hhmm: string) => void;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={() => onConfirm("19:00")}>
          pick-time
        </button>
        <button type="button" onClick={onClose}>
          close-time
        </button>
      </div>
    ) : null,
}));

import { PRIVATE_CLASS_FORM_ID, PrivateClassForm } from "./PrivateClassForm";

describe("PrivateClassForm", () => {
  beforeEach(() => {
    usePrivateClassFormMock.mockReset();
  });

  it("renders stripe defaults: date/time placeholders and send-link submit", () => {
    usePrivateClassFormMock.mockReturnValue(createMockPrivateClassFormReturn());
    renderWithProviders(<PrivateClassForm />);

    expect(screen.getByRole("button", { name: "DATE" })).toHaveTextContent(
      "Choose date",
    );
    expect(screen.getByRole("button", { name: "START TIME" })).toHaveTextContent(
      "Choose time",
    );
    expect(
      screen.getByRole("button", { name: "SEND PAYMENT LINK" }),
    ).toBeEnabled();
    expect(
      screen.queryByText(/I confirm cash payment was received/i),
    ).not.toBeInTheDocument();
  });

  it("patches every text field", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn();
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.type(screen.getByRole("textbox", { name: "CLASS TYPE" }), "Salsa");
    expect(hook.patch).toHaveBeenCalledWith({ classType: "S" });

    await user.type(screen.getByRole("textbox", { name: "LOCATION" }), "Studio");
    expect(hook.patch).toHaveBeenCalledWith({ location: "S" });

    await user.type(screen.getByRole("textbox", { name: "CLIENT NAME" }), "A");
    expect(hook.patch).toHaveBeenCalledWith({ customerName: "A" });
    await user.type(screen.getByRole("textbox", { name: "EMAIL" }), "b");
    expect(hook.patch).toHaveBeenCalledWith({ customerEmail: "b" });
    await user.type(screen.getByRole("textbox", { name: "PHONE (OPTIONAL)" }), "1");
    expect(hook.patch).toHaveBeenCalledWith({ customerPhone: "1" });
    await user.type(screen.getByRole("textbox", { name: "INTERNAL NOTES" }), "n");
    expect(hook.patch).toHaveBeenCalledWith({ notes: "n" });
    await user.type(screen.getByPlaceholderText("150"), "9");
    expect(hook.patch).toHaveBeenCalledWith({ amountUsd: "9" });
  });

  it("opens the date picker and confirms an ISO date", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn({ datePickerOpen: true });
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.click(screen.getByRole("button", { name: "pick-date" }));
    expect(hook.patch).toHaveBeenCalledWith({ eventDate: "2030-06-15" });
    expect(hook.setDatePickerOpen).toHaveBeenCalledWith(false);
  });

  it("opens the date picker from the date button and closes it", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn();
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.click(screen.getByRole("button", { name: "DATE" }));
    expect(hook.setDatePickerOpen).toHaveBeenCalledWith(true);
  });

  it("closes the date picker without confirming", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn({ datePickerOpen: true });
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.click(screen.getByRole("button", { name: "close-date" }));
    expect(hook.setDatePickerOpen).toHaveBeenCalledWith(false);
  });

  it("shows a selected date ISO and formatted start time", () => {
    usePrivateClassFormMock.mockReturnValue(
      createMockPrivateClassFormReturn({
        fields: { eventDate: "2030-06-15", eventTimeStart: "19:00" },
      }),
    );
    renderWithProviders(<PrivateClassForm />);

    expect(screen.getByRole("button", { name: "DATE" })).toHaveTextContent(
      "2030-06-15",
    );
    expect(screen.getByRole("button", { name: "START TIME" })).toHaveTextContent(
      /7:00\s*PM/i,
    );
  });

  it("opens and confirms the time picker", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn({ timePickerOpen: true });
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.click(screen.getByRole("button", { name: "pick-time" }));
    expect(hook.patch).toHaveBeenCalledWith({ eventTimeStart: "19:00" });
    expect(hook.setTimePickerOpen).toHaveBeenCalledWith(false);
  });

  it("opens the time picker from the time button and closes it", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn();
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.click(screen.getByRole("button", { name: "START TIME" }));
    expect(hook.setTimePickerOpen).toHaveBeenCalledWith(true);
  });

  it("closes the time picker without confirming", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn({ timePickerOpen: true });
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.click(screen.getByRole("button", { name: "close-time" }));
    expect(hook.setTimePickerOpen).toHaveBeenCalledWith(false);
  });

  it("switches payment method and shows cash confirmation", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn({
      fields: { paymentMethod: "cash", cashConfirmed: false },
    });
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    expect(
      screen.getByRole("button", { name: "CONFIRM PRIVATE CLASS" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(hook.patch).toHaveBeenCalledWith({ cashConfirmed: true });

    await user.click(screen.getByRole("radio", { name: /stripe/i }));
    expect(hook.setPaymentMethod).toHaveBeenCalledWith("stripe");
  });

  it("unchecks cash confirmation", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn({
      fields: { paymentMethod: "cash", cashConfirmed: true },
    });
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.click(screen.getByRole("checkbox"));
    expect(hook.patch).toHaveBeenCalledWith({ cashConfirmed: false });
  });

  it("selects cash from the stripe radio group", async () => {
    const user = userEvent.setup();
    const hook = createMockPrivateClassFormReturn();
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    await user.click(screen.getByRole("radio", { name: /cash/i }));
    expect(hook.setPaymentMethod).toHaveBeenCalledWith("cash");
  });

  it("disables submit while processing", () => {
    usePrivateClassFormMock.mockReturnValue(
      createMockPrivateClassFormReturn({ submitting: true }),
    );
    renderWithProviders(<PrivateClassForm />);

    expect(screen.getByRole("button", { name: "Processing…" })).toBeDisabled();
  });

  it("submits the form", () => {
    const hook = createMockPrivateClassFormReturn();
    usePrivateClassFormMock.mockReturnValue(hook);
    renderWithProviders(<PrivateClassForm />);

    fireEvent.submit(document.getElementById(PRIVATE_CLASS_FORM_ID)!);
    expect(hook.onSubmit).toHaveBeenCalled();
  });
});
