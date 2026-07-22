"use client";

import {
  formatDateDisplayUs,
  formatTimeDisplayUs,
} from "@/lib/contactLogisticsUtils";
import { fieldLabelClass, logisticsPickerTriggerClass } from "../../shared/lib/agendaFormStyles";
import type { AgendarLogisticsFieldsProps } from "../types/agendarComponents.types";

export function AgendarLogisticsFields({ form, variant }: AgendarLogisticsFieldsProps) {
  const dateButton = (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        className={`${fieldLabelClass} block ${variant === "mobile" ? "text-center" : "text-center sm:text-left"}`}
      >
        {variant === "mobile" ? "DATE" : "DATE"}
      </span>
      <button
        type="button"
        onClick={() => form.setDatePickerOpen(true)}
        className={logisticsPickerTriggerClass}
      >
        <span className="font-body text-foreground">
          {form.eventDateIso ? formatDateDisplayUs(form.eventDateIso) : "Choose date"}
        </span>
        <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">CALENDAR</span>
      </button>
    </div>
  );

  const startButton = (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        className={`${fieldLabelClass} block ${variant === "mobile" ? "text-center" : "text-center sm:text-left"}`}
      >
        {variant === "mobile" ? "START" : "START TIME"}
      </span>
      <button
        type="button"
        onClick={() => form.setTimePickerWhich("start")}
        className={logisticsPickerTriggerClass}
      >
        <span
          className={
            variant === "mobile" ? "min-w-0 truncate font-body text-foreground" : "font-body text-foreground"
          }
        >
          {form.eventTimeStart ? formatTimeDisplayUs(form.eventTimeStart) : variant === "mobile" ? "Time" : "Choose time"}
        </span>
        <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">TIME</span>
      </button>
    </div>
  );

  const endButton = (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        className={`${fieldLabelClass} block ${variant === "mobile" ? "text-center" : "text-center sm:text-left"}`}
      >
        {variant === "mobile" ? "END" : "END TIME"}
      </span>
      <button
        type="button"
        onClick={() => form.setTimePickerWhich("end")}
        className={logisticsPickerTriggerClass}
      >
        <span
          className={
            variant === "mobile" ? "min-w-0 truncate font-body text-foreground" : "font-body text-foreground"
          }
        >
          {form.eventTimeEnd ? formatTimeDisplayUs(form.eventTimeEnd) : variant === "mobile" ? "Time" : "Choose time"}
        </span>
        <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">TIME</span>
      </button>
    </div>
  );

  if (variant === "mobile") {
    return (
      <div className="block">
        <span className={`${fieldLabelClass} block text-center`}>EVENT DATE & TIME</span>
        <div className="mx-auto mt-2 w-full max-w-5xl space-y-4">
          {dateButton}
          <div className="grid grid-cols-2 gap-3">
            {startButton}
            {endButton}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="block">
      <span className={`${fieldLabelClass} block text-center`}>EVENT DATE & TIME</span>
      <div className="mx-auto mt-2 grid w-full max-w-5xl grid-cols-1 gap-4 sm:mt-3 sm:grid-cols-3 sm:gap-5 md:gap-8">
        {dateButton}
        {startButton}
        {endButton}
      </div>
    </div>
  );
}
