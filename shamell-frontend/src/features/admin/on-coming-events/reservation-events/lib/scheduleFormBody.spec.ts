import { describe, expect, it } from "vitest";
import { emptyScheduleForm } from "../components/ReservationEventScheduleSections";
import { scheduleFormToTemplateBody } from "./scheduleFormBody";
import { defaultReservationWeekdays } from "./reservationEventTemplateDefaults";

describe("scheduleFormToTemplateBody", () => {
  it("builds FIXED_EVENT payload from schedule form", () => {
    const schedule = emptyScheduleForm();
    schedule.salesStartDate = "2030-07-01";
    schedule.salesEndDate = "2030-07-31";
    schedule.eventDate = "2030-08-01";
    schedule.eventStartTime = "20:00";
    schedule.eventEndTime = "23:00";

    expect(scheduleFormToTemplateBody("  Saturday Gala  ", schedule)).toEqual({
      name: "Saturday Gala",
      timezone: "America/New_York",
      scheduleMode: "FIXED_EVENT",
      salesStartDate: "2030-07-01",
      salesEndDate: "2030-07-31",
      eventDate: "2030-08-01",
      eventStartTime: "20:00",
      eventEndTime: "23:00",
    });
  });

  it("builds RECURRING_WEEKLY payload with class sections", () => {
    const schedule = emptyScheduleForm();
    schedule.scheduleMode = "RECURRING_WEEKLY";
    schedule.weekdays = defaultReservationWeekdays().map((w) =>
      w.weekday === 1 ? { ...w, isActive: true } : { ...w, isActive: false },
    );
    schedule.recurringStartTime = "19:00";
    schedule.recurringEndTime = "21:00";
    schedule.classSections = [
      {
        weekday: 1,
        label: " Beginner ",
        startTime: "19:00",
        endTime: "20:00",
        sortOrder: 0,
        defaultCapacity: "20",
        defaultPrice: "25",
      },
    ];

    expect(scheduleFormToTemplateBody("Weekly Bachata", schedule)).toEqual({
      name: "Weekly Bachata",
      timezone: "America/New_York",
      scheduleMode: "RECURRING_WEEKLY",
      weekdays: schedule.weekdays,
      recurringStartTime: "19:00",
      recurringEndTime: "21:00",
      classSections: [
        {
          weekday: 1,
          label: "Beginner",
          startTime: "19:00",
          endTime: "20:00",
          sortOrder: 0,
          defaultCapacity: 20,
          defaultPrice: 25,
        },
      ],
    });
  });
});
