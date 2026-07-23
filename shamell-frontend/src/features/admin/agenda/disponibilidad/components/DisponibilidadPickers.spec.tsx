/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: ({ isOpen, title, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="time-picker">
        <span>{title}</span>
        <button onClick={() => onConfirm("10:30")}>confirm-time</button>
        <button onClick={onClose}>close-time</button>
      </div>
    ) : null,
}));

vi.mock("@/features/contacto/components/ContactDatePickerModal", () => ({
  default: ({ isOpen, title, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="date-picker">
        <span>{title}</span>
        <button onClick={() => onConfirm("2030-01-01")}>confirm-date</button>
        <button onClick={onClose}>close-date</button>
      </div>
    ) : null,
}));

import DisponibilidadPickers from "./DisponibilidadPickers";

function baseProps(
  overrides: Partial<React.ComponentProps<typeof DisponibilidadPickers>> = {},
) {
  return {
    timePickerTarget: null,
    pickerValue: "",
    onCloseTimePicker: vi.fn(),
    onTimePickerConfirm: vi.fn(),
    closureDatePickerTarget: null,
    closureDate: "",
    closureStartDate: "",
    closureEndDate: "",
    onCloseDatePicker: vi.fn(),
    onClosureDateConfirm: vi.fn(),
    ...overrides,
  };
}

describe("DisponibilidadPickers", () => {
  it("renders neither picker when nothing is targeted", () => {
    renderWithProviders(<DisponibilidadPickers {...baseProps()} />);
    expect(screen.queryByTestId("time-picker")).not.toBeInTheDocument();
    expect(screen.queryByTestId("date-picker")).not.toBeInTheDocument();
  });

  it("shows the 'Start time' title for the start time picker target", () => {
    renderWithProviders(
      <DisponibilidadPickers
        {...baseProps({ timePickerTarget: { weekday: 1, field: "start" } })}
      />,
    );
    expect(screen.getByText("Start time")).toBeInTheDocument();
  });

  it("shows the 'End time' title for the end time picker target", () => {
    renderWithProviders(
      <DisponibilidadPickers {...baseProps({ timePickerTarget: { weekday: 1, field: "end" } })} />,
    );
    expect(screen.getByText("End time")).toBeInTheDocument();
  });

  it("shows the 'Closure date' title for the single date picker target", () => {
    renderWithProviders(
      <DisponibilidadPickers {...baseProps({ closureDatePickerTarget: "single" })} />,
    );
    expect(screen.getByText("Closure date")).toBeInTheDocument();
  });

  it("shows the 'Start date' title for the start date picker target", () => {
    renderWithProviders(
      <DisponibilidadPickers {...baseProps({ closureDatePickerTarget: "start" })} />,
    );
    expect(screen.getByText("Start date")).toBeInTheDocument();
  });

  it("shows the 'End date' title for the end date picker target", () => {
    renderWithProviders(
      <DisponibilidadPickers {...baseProps({ closureDatePickerTarget: "end" })} />,
    );
    expect(screen.getByText("End date")).toBeInTheDocument();
  });

  it("calls onTimePickerConfirm when the time picker confirms", async () => {
    const user = userEvent.setup();
    const onTimePickerConfirm = vi.fn();
    renderWithProviders(
      <DisponibilidadPickers
        {...baseProps({
          timePickerTarget: { weekday: 1, field: "start" },
          onTimePickerConfirm,
        })}
      />,
    );

    await user.click(screen.getByText("confirm-time"));
    expect(onTimePickerConfirm).toHaveBeenCalledWith("10:30");
  });

  it("calls onCloseTimePicker when the time picker closes", async () => {
    const user = userEvent.setup();
    const onCloseTimePicker = vi.fn();
    renderWithProviders(
      <DisponibilidadPickers
        {...baseProps({ timePickerTarget: { weekday: 1, field: "start" }, onCloseTimePicker })}
      />,
    );

    await user.click(screen.getByText("close-time"));
    expect(onCloseTimePicker).toHaveBeenCalledOnce();
  });

  it("calls onClosureDateConfirm when the date picker confirms", async () => {
    const user = userEvent.setup();
    const onClosureDateConfirm = vi.fn();
    renderWithProviders(
      <DisponibilidadPickers
        {...baseProps({ closureDatePickerTarget: "single", onClosureDateConfirm })}
      />,
    );

    await user.click(screen.getByText("confirm-date"));
    expect(onClosureDateConfirm).toHaveBeenCalledWith("2030-01-01");
  });

  it("calls onCloseDatePicker when the date picker closes", async () => {
    const user = userEvent.setup();
    const onCloseDatePicker = vi.fn();
    renderWithProviders(
      <DisponibilidadPickers
        {...baseProps({ closureDatePickerTarget: "single", onCloseDatePicker })}
      />,
    );

    await user.click(screen.getByText("close-date"));
    expect(onCloseDatePicker).toHaveBeenCalledOnce();
  });
});
