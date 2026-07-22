import { motion } from "motion/react";
import { formatTimeDisplayUs } from "@/lib/contactLogisticsUtils";
import { WEEKDAY_LABEL } from "../lib/disponibilidadConstants";
import {
  disponibilidadBodyTextClass,
  disponibilidadDayLabelClass,
  disponibilidadTimeTriggerClass,
} from "../lib/disponibilidadStyles";
import type { PublicWeeklySlot } from "@/lib/bookingAvailability";
import type { TimePickerTarget } from "../types/disponibilidad.types";

type Props = {
  row: PublicWeeklySlot;
  onClosedChange: (weekday: number, isClosed: boolean) => void;
  onOpenTimePicker: (target: TimePickerTarget) => void;
};

export default function DisponibilidadWeeklyRow({ row, onClosedChange, onOpenTimePicker }: Props) {
  return (
    <motion.div
      key={row.weekday}
      layout
      transition={{ layout: { type: "spring", damping: 28, stiffness: 320 } }}
      className="shamell-glass-surface flex flex-col gap-3 rounded-xl px-3 py-3 sm:px-4 md:flex-row md:items-center md:gap-5"
    >
      <div className="flex min-w-0 items-center justify-between gap-3 md:block md:w-36 md:shrink-0">
        <div className={disponibilidadDayLabelClass}>
          {WEEKDAY_LABEL[row.weekday] ?? row.weekday}
        </div>
        <label className={`flex shrink-0 items-center gap-2.5 md:mt-2 ${disponibilidadBodyTextClass}`}>
          <input
            type="checkbox"
            className="shamell-admin-checkbox"
            checked={row.isClosed}
            onChange={(e) => onClosedChange(row.weekday, e.target.checked)}
          />
          Closed
        </label>
      </div>
      {!row.isClosed ? (
        <div className="grid min-w-0 w-full grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center md:flex-1">
          <button
            type="button"
            onClick={() => onOpenTimePicker({ weekday: row.weekday, field: "start" })}
            className={disponibilidadTimeTriggerClass}
          >
            {row.startTime ? formatTimeDisplayUs(row.startTime) : "Choose time"}
          </button>
          <span className="hidden text-center text-base text-foreground/40 sm:block" aria-hidden>
            —
          </span>
          <button
            type="button"
            onClick={() => onOpenTimePicker({ weekday: row.weekday, field: "end" })}
            className={disponibilidadTimeTriggerClass}
          >
            {row.endTime ? formatTimeDisplayUs(row.endTime) : "Choose time"}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
