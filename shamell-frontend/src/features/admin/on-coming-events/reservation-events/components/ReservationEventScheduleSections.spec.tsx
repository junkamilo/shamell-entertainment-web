/** @vitest-environment jsdom */

import { useState, type Dispatch, type SetStateAction } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeRecurringReservationEventTemplate,
  makeReservationEventTemplate,
} from "../../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import { defaultReservationWeekdays } from "../lib/reservationEventTemplateDefaults";
import type { ClassSectionFormRow } from "../types/reservationEventTemplate.types";
import {
  emptyScheduleForm,
  ReservationEventScheduleSections,
  scheduleFormFromTemplate,
  type ScheduleExperienceMode,
  type ScheduleFormState,
} from "./ReservationEventScheduleSections";

vi.mock("./ReservationEventSchedulePickers", () => ({
  ReservationEventSchedulePickers: (props: {
    onCloseDate: () => void;
    onCloseTime: () => void;
    onSalesStartDate: (iso: string) => void;
    onSalesEndDate: (iso: string) => void;
    onEventDate: (iso: string) => void;
    onEventStartTime: (hhmm: string) => void;
    onEventEndTime: (hhmm: string) => void;
    onRecurStartTime: (hhmm: string) => void;
    onRecurEndTime: (hhmm: string) => void;
  }) => (
    <div data-testid="schedule-pickers">
      <button type="button" onClick={() => props.onSalesStartDate("2030-07-01")}>
        pick-sales-start
      </button>
      <button type="button" onClick={() => props.onSalesEndDate("2030-07-31")}>
        pick-sales-end
      </button>
      <button type="button" onClick={() => props.onEventDate("2030-08-01")}>
        pick-event-date
      </button>
      <button type="button" onClick={() => props.onEventStartTime("20:00")}>
        pick-event-start
      </button>
      <button type="button" onClick={() => props.onEventEndTime("23:00")}>
        pick-event-end
      </button>
      <button type="button" onClick={() => props.onRecurStartTime("10:00")}>
        pick-recur-start
      </button>
      <button type="button" onClick={() => props.onRecurEndTime("12:00")}>
        pick-recur-end
      </button>
      <button type="button" onClick={props.onCloseDate}>
        close-date
      </button>
      <button type="button" onClick={props.onCloseTime}>
        close-time
      </button>
    </div>
  ),
}));

vi.mock("./RecurringClassBulkSectionsEditor", () => ({
  BULK_SECTION_WEEKDAY: -1,
  RecurringClassBulkSectionsEditor: ({
    onApply,
    onPickTime,
  }: {
    onApply: (sections: ClassSectionFormRow[]) => void;
    onPickTime: (sortOrder: number, field: "start" | "end") => void;
  }) => (
    <div data-testid="bulk-sections-editor">
      <button
        type="button"
        onClick={() =>
          onApply([
            {
              weekday: 1,
              label: "Bulk",
              startTime: "10:00",
              endTime: "12:00",
              sortOrder: 0,
              defaultCapacity: "20",
              defaultPrice: "25",
            },
          ])
        }
      >
        bulk-apply
      </button>
      <button type="button" onClick={() => onApply([])}>
        bulk-apply-empty
      </button>
      <button type="button" onClick={() => onPickTime(0, "start")}>
        bulk-pick-start
      </button>
      <button type="button" onClick={() => onPickTime(0, "end")}>
        bulk-pick-end
      </button>
      <button type="button" onClick={() => onPickTime(99, "start")}>
        bulk-pick-missing
      </button>
    </div>
  ),
}));

vi.mock("./RecurringClassSectionsEditor", () => ({
  RecurringClassSectionsEditor: ({
    onChange,
    onPickTime,
  }: {
    onChange: (sections: ClassSectionFormRow[]) => void;
    onPickTime: (weekday: number, sortOrder: number, field: "start" | "end") => void;
  }) => (
    <div data-testid="recurring-sections-editor">
      <button
        type="button"
        onClick={() =>
          onChange([
            {
              weekday: 1,
              label: "Edited",
              startTime: "11:00",
              endTime: "13:00",
              sortOrder: 0,
              defaultCapacity: "8",
              defaultPrice: "20",
            },
          ])
        }
      >
        section-change
      </button>
      <button type="button" onClick={() => onChange([])}>
        section-change-empty
      </button>
      <button type="button" data-testid="section-pick-start" onClick={() => onPickTime(1, 0, "start")}>
        section-pick-start
      </button>
      <button type="button" onClick={() => onPickTime(1, 0, "end")}>
        section-pick-end
      </button>
      <button type="button" onClick={() => onPickTime(1, 99, "end")}>
        section-pick-missing
      </button>
    </div>
  ),
}));

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: ({
    isOpen,
    title,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    onConfirm: (hhmm: string) => void;
  }) =>
    isOpen ? (
      <div>
        <p>{title}</p>
        <button type="button" onClick={() => onConfirm("15:00")}>
          confirm-section-time
        </button>
        <button type="button" onClick={onClose}>
          close-section-time
        </button>
      </div>
    ) : null,
}));

function Harness({
  initial,
  experienceMode: experienceModeProp,
  ...rest
}: {
  initial: ScheduleFormState;
  experienceMode?: ScheduleExperienceMode;
  onExperienceModeChange?: (mode: ScheduleExperienceMode) => void;
  enableVenueSeating?: boolean;
  onEnableVenueSeatingChange?: (enabled: boolean) => void;
  fixedTicketCapacityInput?: string;
  onFixedTicketCapacityInputChange?: (value: string) => void;
  monthPackageEnabled?: boolean;
  onMonthPackageEnabledChange?: (enabled: boolean) => void;
  monthPackagePrice?: string;
  onMonthPackagePriceChange?: (value: string) => void;
  monthPackageLabel?: string;
  onMonthPackageLabelChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [experienceMode, setExperienceMode] = useState(experienceModeProp);
  return (
    <ReservationEventScheduleSections
      value={value}
      onChange={setValue as Dispatch<SetStateAction<ScheduleFormState>>}
      experienceMode={experienceMode}
      onExperienceModeChange={(mode) => {
        setExperienceMode(mode);
        rest.onExperienceModeChange?.(mode);
      }}
      {...rest}
    />
  );
}

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

  it("scheduleFormFromTemplate keeps a full weekday list", () => {
    const weekdays = defaultReservationWeekdays();
    const form = scheduleFormFromTemplate(
      makeReservationEventTemplate({ weekdays }),
    );
    expect(form.weekdays).toEqual(weekdays);
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

  it("falls back from weekdays when class sections are empty", () => {
    const form = scheduleFormFromTemplate(
      makeRecurringReservationEventTemplate({
        classSections: [],
        recurringStartTime: null,
        recurringEndTime: null,
        weekdays: [
          { weekday: 1, isActive: true },
          { weekday: 2, isActive: false },
        ],
      }),
    );
    expect(form.classSections).toEqual([
      expect.objectContaining({
        weekday: 1,
        label: "",
        startTime: "10:00",
        endTime: "12:00",
      }),
    ]);
  });

  it("treats a missing weekdays list as empty when deriving sections", () => {
    const form = scheduleFormFromTemplate(
      makeRecurringReservationEventTemplate({
        classSections: [],
        weekdays: undefined as unknown as [],
      }),
    );
    expect(form.classSections).toEqual([]);
  });

  it("maps null section labels and prices to empty strings", () => {
    const form = scheduleFormFromTemplate(
      makeRecurringReservationEventTemplate({
        classSections: [
          {
            id: "sec-1",
            weekday: 1,
            label: null,
            startTime: "19:00",
            endTime: "20:00",
            sortOrder: 0,
            defaultCapacity: 20,
            defaultPrice: null,
            isActive: true,
          },
        ],
      }),
    );
    expect(form.classSections[0]).toMatchObject({ label: "", defaultPrice: "" });
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

  it("toggles two-state schedule mode", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness initial={emptyScheduleForm()} />);
    await user.click(screen.getByText("Activate RECURRING WEEKDAYS (CLASSES)"));
    expect(screen.getByText("Activate RECURRING WEEKDAYS (CLASSES)").closest("label")).toBeTruthy();
  });

  it("turns an active three-state card back to NORMAL", async () => {
    const user = userEvent.setup();
    const onExperienceModeChange = vi.fn();
    renderWithProviders(
      <Harness
        initial={emptyScheduleForm()}
        experienceMode="FIXED_EVENT"
        onExperienceModeChange={onExperienceModeChange}
      />,
    );
    await user.click(screen.getByText("Activate FIXED EVENT"));
    expect(onExperienceModeChange).toHaveBeenCalledWith("NORMAL");
  });

  it("shows venue seating options in three-state mode", async () => {
    const user = userEvent.setup();
    const onEnableVenueSeatingChange = vi.fn();
    const onFixedTicketCapacityInputChange = vi.fn();
    renderWithProviders(
      <ReservationEventScheduleSections
        value={{
          ...emptyScheduleForm(),
          salesStartDate: "2030-07-01",
          salesEndDate: "2030-07-31",
          eventDate: "2030-08-01",
          eventStartTime: "",
          eventEndTime: "",
        }}
        onChange={vi.fn()}
        experienceMode="FIXED_EVENT"
        onExperienceModeChange={vi.fn()}
        onEnableVenueSeatingChange={onEnableVenueSeatingChange}
        onFixedTicketCapacityInputChange={onFixedTicketCapacityInputChange}
        enableVenueSeating={false}
        fixedTicketCapacityInput="50"
      />,
    );
    await user.click(
      screen.getByRole("checkbox", { name: /ASSOCIATE TABLE & SEAT SALES/i }),
    );
    expect(onEnableVenueSeatingChange).toHaveBeenCalledWith(true);
    await user.clear(screen.getByLabelText("Tickets for sale"));
    await user.type(screen.getByLabelText("Tickets for sale"), "80");
    expect(onFixedTicketCapacityInputChange).toHaveBeenCalled();
    expect(
      screen.getByText(/Required when table & seat sales are off/),
    ).toBeInTheDocument();
  });

  it("disables ticket capacity when venue seating is enabled", () => {
    renderWithProviders(
      <ReservationEventScheduleSections
        value={emptyScheduleForm()}
        onChange={vi.fn()}
        experienceMode="FIXED_EVENT"
        onExperienceModeChange={vi.fn()}
        enableVenueSeating
        onEnableVenueSeatingChange={vi.fn()}
        onFixedTicketCapacityInputChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Tickets for sale")).toBeDisabled();
    expect(screen.getByText(/Seat\/table inventory controls capacity/)).toBeInTheDocument();
  });

  it("shows month package fields for recurring experience mode", async () => {
    const user = userEvent.setup();
    const onMonthPackageEnabledChange = vi.fn();
    const onMonthPackagePriceChange = vi.fn();
    const onMonthPackageLabelChange = vi.fn();
    renderWithProviders(
      <ReservationEventScheduleSections
        value={{ ...emptyScheduleForm(), scheduleMode: "RECURRING_WEEKLY" }}
        onChange={vi.fn()}
        experienceMode="RECURRING_WEEKLY"
        onExperienceModeChange={vi.fn()}
        monthPackageEnabled
        onMonthPackageEnabledChange={onMonthPackageEnabledChange}
        monthPackagePrice="299"
        onMonthPackagePriceChange={onMonthPackagePriceChange}
        monthPackageLabel="Pass"
        onMonthPackageLabelChange={onMonthPackageLabelChange}
      />,
    );
    expect(screen.getByText("Full month package")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Enable" }));
    expect(onMonthPackageEnabledChange).toHaveBeenCalledWith(false);
    await user.type(screen.getByPlaceholderText("e.g. 299.00"), "0");
    await user.type(screen.getByPlaceholderText("Full month pass"), "x");
    expect(onMonthPackagePriceChange).toHaveBeenCalled();
    expect(onMonthPackageLabelChange).toHaveBeenCalled();
  });

  it("hides month package price fields when the package is disabled", () => {
    renderWithProviders(
      <ReservationEventScheduleSections
        value={{ ...emptyScheduleForm(), scheduleMode: "RECURRING_WEEKLY" }}
        onChange={vi.fn()}
        experienceMode="RECURRING_WEEKLY"
        onExperienceModeChange={vi.fn()}
        monthPackageEnabled={false}
        onMonthPackageEnabledChange={vi.fn()}
      />,
    );
    expect(screen.queryByPlaceholderText("e.g. 299.00")).not.toBeInTheDocument();
  });

  it("syncs weekday toggles into class sections", async () => {
    const user = userEvent.setup();
    const form = emptyScheduleForm();
    form.scheduleMode = "RECURRING_WEEKLY";
    form.weekdays = form.weekdays.map((w) => ({ ...w, isActive: w.weekday === 1 }));
    form.recurringStartTime = "";
    form.recurringEndTime = "";
    renderWithProviders(<Harness initial={form} />);
    await user.click(screen.getByRole("button", { name: "WED" }));
    expect(screen.getByTestId("bulk-sections-editor")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "MON" }));
    expect(screen.queryByTestId("bulk-sections-editor")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "WED" }));
    expect(screen.queryByTestId("bulk-sections-editor")).not.toBeInTheDocument();
  });

  it("applies bulk and per-day section edits and date/time pickers", async () => {
    const user = userEvent.setup();
    const form = emptyScheduleForm();
    form.scheduleMode = "RECURRING_WEEKLY";
    form.weekdays = form.weekdays.map((w) =>
      w.weekday === 1 || w.weekday === 3 ? { ...w, isActive: true } : { ...w, isActive: false },
    );
    form.classSections = [
      {
        weekday: 1,
        label: "Beginner",
        startTime: "10:00",
        endTime: "12:00",
        sortOrder: 0,
        defaultCapacity: "20",
        defaultPrice: "25",
      },
    ];
    renderWithProviders(<Harness initial={form} />);

    await user.click(screen.getByRole("button", { name: "bulk-apply" }));
    await user.click(screen.getByRole("button", { name: "bulk-apply-empty" }));
    await user.click(screen.getByRole("button", { name: "section-change" }));
    await user.click(screen.getByRole("button", { name: "section-change-empty" }));

    await user.click(screen.getByRole("button", { name: "pick-sales-start" }));
    await user.click(screen.getByRole("button", { name: "pick-sales-end" }));
    await user.click(screen.getByRole("button", { name: "pick-event-date" }));
    await user.click(screen.getByRole("button", { name: "pick-event-start" }));
    await user.click(screen.getByRole("button", { name: "pick-event-end" }));
    await user.click(screen.getByRole("button", { name: "pick-recur-start" }));
    await user.click(screen.getByRole("button", { name: "pick-recur-end" }));
    await user.click(screen.getByRole("button", { name: "close-date" }));
    await user.click(screen.getByRole("button", { name: "close-time" }));

    const clickLabeledPicker = async (label: string) => {
      const button = screen.getByText(label).parentElement?.querySelector("button");
      expect(button).toBeTruthy();
      await user.click(button!);
    };
    await clickLabeledPicker("Sales start");
    await clickLabeledPicker("Sales end");
    await clickLabeledPicker("Event date");
    await clickLabeledPicker("Event start time");
    await clickLabeledPicker("Event end time");
  });

  it("opens bulk and per-section time pickers and confirms both fields", async () => {
    const user = userEvent.setup();
    const form = emptyScheduleForm();
    form.scheduleMode = "RECURRING_WEEKLY";
    form.weekdays = form.weekdays.map((w) =>
      w.weekday === 1 || w.weekday === 3 ? { ...w, isActive: true } : { ...w, isActive: false },
    );
    form.classSections = [
      {
        weekday: 1,
        label: "Beginner",
        startTime: "10:00",
        endTime: "12:00",
        sortOrder: 0,
        defaultCapacity: "20",
        defaultPrice: "25",
      },
      {
        weekday: 3,
        label: "Other",
        startTime: "18:00",
        endTime: "19:00",
        sortOrder: 0,
        defaultCapacity: "10",
        defaultPrice: "15",
      },
    ];
    renderWithProviders(<Harness initial={form} />);

    await user.click(screen.getByRole("button", { name: "bulk-pick-missing" }));
    expect(screen.getByText("Section start")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-section-time" }));

    await user.click(screen.getByRole("button", { name: "bulk-pick-start" }));
    expect(screen.getByText("Section start")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-section-time" }));

    await user.click(screen.getByRole("button", { name: "bulk-pick-end" }));
    expect(screen.getByText("Section end")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-section-time" }));

    await user.click(screen.getByRole("button", { name: "section-pick-start" }));
    expect(screen.getByText("Section start")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-section-time" }));

    await user.click(screen.getByRole("button", { name: "section-pick-end" }));
    expect(screen.getByText("Section end")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-section-time" }));

    await user.click(screen.getByRole("button", { name: "section-pick-missing" }));
    expect(screen.getByText("Section end")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-section-time" }));
  });

  it("infers a shared blueprint when two matching weekdays become active", () => {
    const form = emptyScheduleForm();
    form.scheduleMode = "RECURRING_WEEKLY";
    form.weekdays = form.weekdays.map((w) =>
      w.weekday === 1 || w.weekday === 3 ? { ...w, isActive: true } : { ...w, isActive: false },
    );
    const shared = {
      label: "Shared",
      startTime: "19:00",
      endTime: "20:00",
      sortOrder: 0,
      defaultCapacity: "20",
      defaultPrice: "25",
    };
    form.classSections = [
      { weekday: 1, ...shared },
      { weekday: 3, ...shared },
    ];
    renderWithProviders(<Harness initial={form} />);
    expect(screen.getByTestId("bulk-sections-editor")).toBeInTheDocument();
  });

  it("updates a matching class section start time from the picker", () => {
    const form = emptyScheduleForm();
    form.scheduleMode = "RECURRING_WEEKLY";
    form.weekdays = form.weekdays.map((w) =>
      w.weekday === 1 || w.weekday === 3 ? { ...w, isActive: true } : { ...w, isActive: false },
    );
    const morning = {
      label: "Morning",
      startTime: "10:00",
      endTime: "12:00",
      defaultCapacity: "20",
      defaultPrice: "25",
    };
    const evening = {
      label: "Evening",
      startTime: "18:00",
      endTime: "20:00",
      defaultCapacity: "12",
      defaultPrice: "30",
    };
    form.classSections = [
      { weekday: 1, sortOrder: 0, ...morning },
      { weekday: 1, sortOrder: 1, ...evening },
      { weekday: 3, sortOrder: 0, ...morning },
      { weekday: 3, sortOrder: 1, ...evening },
    ];
    renderWithProviders(<Harness initial={form} />);
    fireEvent.click(screen.getByTestId("section-pick-start"));
    expect(screen.getByText("Section start")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "confirm-section-time" }));
    fireEvent.click(screen.getByRole("button", { name: "bulk-pick-start" }));
    fireEvent.click(screen.getByRole("button", { name: "confirm-section-time" }));
  });

  it("falls back to 10:00 when the picked section is missing", async () => {
    const user = userEvent.setup();
    const form = emptyScheduleForm();
    form.scheduleMode = "RECURRING_WEEKLY";
    form.weekdays = form.weekdays.map((w) =>
      w.weekday === 1 || w.weekday === 3 ? { ...w, isActive: true } : { ...w, isActive: false },
    );
    form.classSections = [];
    renderWithProviders(<Harness initial={form} />);
    await user.click(screen.getByRole("button", { name: "section-pick-start" }));
    expect(screen.getByText("Section start")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-section-time" }));

    await user.click(screen.getByRole("button", { name: "bulk-pick-start" }));
    await user.click(screen.getByRole("button", { name: "confirm-section-time" }));
  });
});
