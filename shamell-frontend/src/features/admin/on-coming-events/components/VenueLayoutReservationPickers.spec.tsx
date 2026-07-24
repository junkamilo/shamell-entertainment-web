/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { VenueLayoutReservationPickers } from "./VenueLayoutReservationPickers";

vi.mock("@/features/contacto/components/ContactDatePickerModal", () => ({
  default: ({
    isOpen,
    title,
  }: {
    isOpen: boolean;
    title: string;
  }) => (isOpen ? <div data-testid={`date-picker-${title}`} /> : null),
}));

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: ({
    isOpen,
    title,
  }: {
    isOpen: boolean;
    title: string;
  }) => (isOpen ? <div data-testid={`time-picker-${title}`} /> : null),
}));

describe("VenueLayoutReservationPickers", () => {
  it("opens sales open date picker when targeted", () => {
    renderWithProviders(
      <VenueLayoutReservationPickers
        datePickerTarget="open"
        timePickerTarget={null}
        openDate=""
        closeDate=""
        openTime=""
        closeTime=""
        onCloseDatePicker={vi.fn()}
        onCloseTimePicker={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId("date-picker-Sales open date"),
    ).toBeInTheDocument();
  });

  it("opens event night time picker when targeted", () => {
    renderWithProviders(
      <VenueLayoutReservationPickers
        datePickerTarget={null}
        timePickerTarget="eventNight"
        openDate=""
        closeDate=""
        openTime=""
        closeTime=""
        eventNightDate=""
        eventNightTime=""
        onCloseDatePicker={vi.fn()}
        onCloseTimePicker={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId("time-picker-Event night time"),
    ).toBeInTheDocument();
  });
});
