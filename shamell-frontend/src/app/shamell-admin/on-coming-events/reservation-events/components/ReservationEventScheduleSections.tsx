"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  fieldLabelClass,
  logisticsPickerTriggerClass,
} from "@/app/shamell-admin/agenda/agendar/lib/agendarStyles";
import { formatDateDisplayUs, formatTimeDisplayUs } from "@/lib/contactLogisticsUtils";
import {
  defaultReservationWeekdays,
  todayIsoDateInTimezone,
} from "../lib/reservationEventTemplateDefaults";
import type {
  ReservationEventScheduleMode,
  ReservationEventTemplate,
  ReservationEventWeekday,
} from "../types/reservationEventTemplate.types";
import { ReservationEventWeekdaySelector } from "./ReservationEventWeekdaySelector";
import {
  ReservationEventSchedulePickers,
  type ScheduleDateTarget,
  type ScheduleTimeTarget,
} from "./ReservationEventSchedulePickers";
import { ScheduleModeToggleSection } from "./ScheduleModeToggleSection";

export type ScheduleFormState = {
  scheduleMode: ReservationEventScheduleMode;
  salesStartDate: string;
  salesEndDate: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  weekdays: ReservationEventWeekday[];
  recurringStartTime: string;
  recurringEndTime: string;
};

export function emptyScheduleForm(): ScheduleFormState {
  return {
    scheduleMode: "FIXED_EVENT",
    salesStartDate: "",
    salesEndDate: "",
    eventDate: "",
    eventStartTime: "18:00",
    eventEndTime: "23:00",
    weekdays: defaultReservationWeekdays(),
    recurringStartTime: "10:00",
    recurringEndTime: "12:00",
  };
}

export function scheduleFormFromTemplate(
  template: ReservationEventTemplate,
): ScheduleFormState {
  const weekdays =
    Array.isArray(template.weekdays) && template.weekdays.length === 7 ?
      template.weekdays
    : defaultReservationWeekdays();
  return {
    scheduleMode: template.scheduleMode,
    salesStartDate: template.salesStartDate ?? "",
    salesEndDate: template.salesEndDate ?? "",
    eventDate: template.eventDate ?? "",
    eventStartTime: template.eventStartTime ?? "18:00",
    eventEndTime: template.eventEndTime ?? "23:00",
    weekdays,
    recurringStartTime: template.recurringStartTime ?? "10:00",
    recurringEndTime: template.recurringEndTime ?? "12:00",
  };
}

function PickerButton({
  label,
  display,
  placeholder,
  badge,
  onClick,
  disabled,
}: {
  label: string;
  display: string;
  placeholder: string;
  badge: "CALENDAR" | "TIME";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={`${fieldLabelClass} block`}>{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={logisticsPickerTriggerClass}
      >
        <span
          className={`font-body text-sm ${display ? "text-foreground" : "text-foreground/50"}`}
        >
          {display || placeholder}
        </span>
        <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">{badge}</span>
      </button>
    </div>
  );
}

type Props = {
  value: ScheduleFormState;
  onChange: Dispatch<SetStateAction<ScheduleFormState>>;
};

export function ReservationEventScheduleSections({ value, onChange }: Props) {
  const minDate = todayIsoDateInTimezone();
  const [dateTarget, setDateTarget] = useState<ScheduleDateTarget>(null);
  const [timeTarget, setTimeTarget] = useState<ScheduleTimeTarget>(null);

  const setMode = (scheduleMode: ReservationEventScheduleMode) => {
    onChange((prev) => ({ ...prev, scheduleMode }));
  };

  const patch = (partial: Partial<ScheduleFormState>) => {
    onChange((prev) => ({ ...prev, ...partial }));
  };

  const fixedActive = value.scheduleMode === "FIXED_EVENT";
  const recurringActive = value.scheduleMode === "RECURRING_WEEKLY";

  return (
    <>
      <ScheduleModeToggleSection
        title="FIXED EVENT (SEAT SALES)"
        description="Set when table sales open and close, plus the single event night and its hours."
        modeValue="FIXED_EVENT"
        active={fixedActive}
        onSelect={() => setMode("FIXED_EVENT")}
      >
        <div className="space-y-4">
          <fieldset className="space-y-3 rounded-lg border border-gold/10 p-3">
            <legend className="px-1 text-[10px] font-medium uppercase tracking-wider text-gold/80">
              Sales window (dates only)
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <PickerButton
                label="Sales start"
                display={value.salesStartDate ? formatDateDisplayUs(value.salesStartDate) : ""}
                placeholder="Choose date"
                badge="CALENDAR"
                onClick={() => setDateTarget("salesStart")}
              />
              <PickerButton
                label="Sales end"
                display={value.salesEndDate ? formatDateDisplayUs(value.salesEndDate) : ""}
                placeholder="Choose date"
                badge="CALENDAR"
                onClick={() => setDateTarget("salesEnd")}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border border-gold/10 p-3">
            <legend className="px-1 text-[10px] font-medium uppercase tracking-wider text-gold/80">
              Event night
            </legend>
            <PickerButton
              label="Event date"
              display={value.eventDate ? formatDateDisplayUs(value.eventDate) : ""}
              placeholder="Choose date"
              badge="CALENDAR"
              onClick={() => setDateTarget("eventDay")}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <PickerButton
                label="Event start time"
                display={value.eventStartTime ? formatTimeDisplayUs(value.eventStartTime) : ""}
                placeholder="Choose time"
                badge="TIME"
                onClick={() => setTimeTarget("eventStart")}
              />
              <PickerButton
                label="Event end time"
                display={value.eventEndTime ? formatTimeDisplayUs(value.eventEndTime) : ""}
                placeholder="Choose time"
                badge="TIME"
                onClick={() => setTimeTarget("eventEnd")}
              />
            </div>
          </fieldset>
        </div>
      </ScheduleModeToggleSection>

      <ScheduleModeToggleSection
        title="RECURRING WEEKDAYS (CLASSES)"
        description="From today onward, on the selected weekdays, with a daily start and end time."
        modeValue="RECURRING_WEEKLY"
        active={recurringActive}
        onSelect={() => setMode("RECURRING_WEEKLY")}
      >
        <div className="space-y-4">
          <ReservationEventWeekdaySelector
            weekdays={value.weekdays}
            disabled={!recurringActive}
            onChange={(weekdays) => patch({ weekdays })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <PickerButton
              label="Start time"
              display={
                value.recurringStartTime ? formatTimeDisplayUs(value.recurringStartTime) : ""
              }
              placeholder="Choose time"
              badge="TIME"
              onClick={() => setTimeTarget("recurStart")}
            />
            <PickerButton
              label="End time"
              display={value.recurringEndTime ? formatTimeDisplayUs(value.recurringEndTime) : ""}
              placeholder="Choose time"
              badge="TIME"
              onClick={() => setTimeTarget("recurEnd")}
            />
          </div>
        </div>
      </ScheduleModeToggleSection>

      <ReservationEventSchedulePickers
        dateTarget={dateTarget}
        timeTarget={timeTarget}
        salesStartDate={value.salesStartDate}
        salesEndDate={value.salesEndDate}
        eventDate={value.eventDate}
        eventStartTime={value.eventStartTime}
        eventEndTime={value.eventEndTime}
        recurringStartTime={value.recurringStartTime}
        recurringEndTime={value.recurringEndTime}
        minSelectableIso={minDate}
        onCloseDate={() => setDateTarget(null)}
        onCloseTime={() => setTimeTarget(null)}
        onSalesStartDate={(iso) => {
          patch({ salesStartDate: iso });
          setDateTarget(null);
        }}
        onSalesEndDate={(iso) => {
          patch({ salesEndDate: iso });
          setDateTarget(null);
        }}
        onEventDate={(iso) => {
          patch({ eventDate: iso });
          setDateTarget(null);
        }}
        onEventStartTime={(hhmm) => {
          patch({ eventStartTime: hhmm });
          setTimeTarget(null);
        }}
        onEventEndTime={(hhmm) => {
          patch({ eventEndTime: hhmm });
          setTimeTarget(null);
        }}
        onRecurStartTime={(hhmm) => {
          patch({ recurringStartTime: hhmm });
          setTimeTarget(null);
        }}
        onRecurEndTime={(hhmm) => {
          patch({ recurringEndTime: hhmm });
          setTimeTarget(null);
        }}
      />
    </>
  );
}
