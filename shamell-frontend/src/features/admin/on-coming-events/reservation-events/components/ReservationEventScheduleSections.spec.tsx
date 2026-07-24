/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeRecurringReservationEventTemplate,
  makeReservationEventTemplate,
} from "../../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import {
  emptyScheduleForm,
  ReservationEventScheduleSections,
  scheduleFormFromTemplate,
} from "./ReservationEventScheduleSections";

vi.mock("./ReservationEventSchedulePickers", () => ({
  ReservationEventSchedulePickers: () => <div data-testid="schedule-pickers" />,
}));

vi.mock("./RecurringClassBulkSectionsEditor", () => ({
  BULK_SECTION_WEEKDAY: -1,
  RecurringClassBulkSectionsEditor: () => <div data-testid="bulk-sections-editor" />,
}));

vi.mock("./RecurringClassSectionsEditor", () => ({
  RecurringClassSectionsEditor: () => <div data-testid="recurring-sections-editor" />,
}));

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: () => null,
}));

describe("ReservationEventScheduleSections helpers", () => {
  it("emptyScheduleForm returns FIXED_EVENT defaults", () => {
    const form = emptyScheduleForm();
    expect(form.scheduleMode).toBe("FIXED_EVENT");
    expect(form.eventStartTime).toBe("18:00");
    expect(form.eventEndTime).toBe("23:00");
    expect(form.weekdays.filter((w) => w.isActive)).toHaveLength(5);
    expect(form.classSections).toEqual([]);
  });

  it("scheduleFormFromTemplate maps fixed template fields", () => {
    const template = makeReservationEventTemplate();
    const form = scheduleFormFromTemplate(template);
    expect(form.scheduleMode).toBe("FIXED_EVENT");
    expect(form.salesStartDate).toBe("2030-07-01");
    expect(form.eventDate).toBe("2030-08-01");
    expect(form.eventStartTime).toBe("20:00");
  });

  it("scheduleFormFromTemplate maps recurring template class sections", () => {
    const template = makeRecurringReservationEventTemplate();
    const form = scheduleFormFromTemplate(template);
    expect(form.scheduleMode).toBe("RECURRING_WEEKLY");
    expect(form.classSections).toHaveLength(1);
    expect(form.classSections[0]).toMatchObject({
      weekday: 1,
      label: "Beginner",
      defaultCapacity: "20",
      defaultPrice: "25",
    });
  });
});

describe("ReservationEventScheduleSections", () => {
  it("renders fixed and recurring mode sections", () => {
    renderWithProviders(
      <ReservationEventScheduleSections
        value={emptyScheduleForm()}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("FIXED EVENT")).toBeInTheDocument();
    expect(screen.getByText("RECURRING WEEKDAYS (CLASSES)")).toBeInTheDocument();
    expect(screen.getByText("Sales start")).toBeInTheDocument();
    expect(screen.getByTestId("schedule-pickers")).toBeInTheDocument();
  });

  it("shows venue seating options in three-state mode", async () => {
    const user = userEvent.setup();
    const onEnableVenueSeatingChange = vi.fn();
    renderWithProviders(
      <ReservationEventScheduleSections
        value={emptyScheduleForm()}
        onChange={vi.fn()}
        experienceMode="FIXED_EVENT"
        onExperienceModeChange={vi.fn()}
        onEnableVenueSeatingChange={onEnableVenueSeatingChange}
        onFixedTicketCapacityInputChange={vi.fn()}
      />,
    );
    const checkbox = screen.getByRole("checkbox", {
      name: /ASSOCIATE TABLE & SEAT SALES/i,
    });
    await user.click(checkbox);
    expect(onEnableVenueSeatingChange).toHaveBeenCalledWith(true);
  });

  it("shows month package section for recurring experience mode", () => {
    renderWithProviders(
      <ReservationEventScheduleSections
        value={{ ...emptyScheduleForm(), scheduleMode: "RECURRING_WEEKLY" }}
        onChange={vi.fn()}
        experienceMode="RECURRING_WEEKLY"
        onExperienceModeChange={vi.fn()}
        onMonthPackageEnabledChange={vi.fn()}
        onMonthPackagePriceChange={vi.fn()}
        onMonthPackageLabelChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Full month package")).toBeInTheDocument();
  });

  it("shows bulk editor when two or more weekdays are active", () => {
    const form = emptyScheduleForm();
    form.scheduleMode = "RECURRING_WEEKLY";
    form.weekdays = form.weekdays.map((w) =>
      w.weekday === 1 || w.weekday === 3 ? { ...w, isActive: true } : { ...w, isActive: false },
    );
    renderWithProviders(
      <ReservationEventScheduleSections value={form} onChange={vi.fn()} />,
    );
    expect(screen.getByTestId("bulk-sections-editor")).toBeInTheDocument();
    expect(screen.getByTestId("recurring-sections-editor")).toBeInTheDocument();
  });
});
