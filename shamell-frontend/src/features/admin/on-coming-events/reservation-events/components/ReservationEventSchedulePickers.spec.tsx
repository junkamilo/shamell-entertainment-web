/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import { ReservationEventSchedulePickers } from "./ReservationEventSchedulePickers";

vi.mock("@/features/contacto/components/ContactDatePickerModal", () => ({
  default: ({
    isOpen,
    title,
  }: {
    isOpen: boolean;
    title: string;
  }) => (isOpen ? <div role="dialog" aria-label={title} /> : null),
}));

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: ({
    isOpen,
    title,
  }: {
    isOpen: boolean;
    title: string;
  }) => (isOpen ? <div role="dialog" aria-label={title} /> : null),
}));

const baseProps = {
  salesStartDate: "2030-07-01",
  salesEndDate: "2030-07-31",
  eventDate: "2030-08-01",
  eventStartTime: "20:00",
  eventEndTime: "23:00",
  recurringStartTime: "19:00",
  recurringEndTime: "21:00",
  minSelectableIso: "2026-01-01",
  onCloseDate: vi.fn(),
  onCloseTime: vi.fn(),
  onSalesStartDate: vi.fn(),
  onSalesEndDate: vi.fn(),
  onEventDate: vi.fn(),
  onEventStartTime: vi.fn(),
  onEventEndTime: vi.fn(),
  onRecurStartTime: vi.fn(),
  onRecurEndTime: vi.fn(),
};

describe("ReservationEventSchedulePickers", () => {
  it("opens sales start date picker", () => {
    renderWithProviders(
      <ReservationEventSchedulePickers
        {...baseProps}
        dateTarget="salesStart"
        timeTarget={null}
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Sales start date" }),
    ).toBeInTheDocument();
  });

  it("opens event date picker", () => {
    renderWithProviders(
      <ReservationEventSchedulePickers
        {...baseProps}
        dateTarget="eventDay"
        timeTarget={null}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Event date" })).toBeInTheDocument();
  });

  it("opens event start time picker", () => {
    renderWithProviders(
      <ReservationEventSchedulePickers
        {...baseProps}
        dateTarget={null}
        timeTarget="eventStart"
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Event start time" }),
    ).toBeInTheDocument();
  });

  it("opens recurring end time picker", () => {
    renderWithProviders(
      <ReservationEventSchedulePickers
        {...baseProps}
        dateTarget={null}
        timeTarget="recurEnd"
      />,
    );
    expect(screen.getByRole("dialog", { name: "End time" })).toBeInTheDocument();
  });

  it("renders nothing when no target is active", () => {
    renderWithProviders(
      <ReservationEventSchedulePickers
        {...baseProps}
        dateTarget={null}
        timeTarget={null}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
