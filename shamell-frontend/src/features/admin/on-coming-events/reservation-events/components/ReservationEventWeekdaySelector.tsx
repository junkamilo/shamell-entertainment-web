"use client";

import { cn } from "@/lib/utils";
import { WEEKDAY_LABEL } from "@/features/admin/agenda/disponibilidad/lib/disponibilidadConstants";
import type { ReservationEventWeekday } from "../types/reservationEventTemplate.types";

type Props = {
  weekdays: ReservationEventWeekday[];
  disabled?: boolean;
  onChange: (weekdays: ReservationEventWeekday[]) => void;
};

export function ReservationEventWeekdaySelector({ weekdays, disabled, onChange }: Props) {
  const toggle = (weekday: number) => {
    if (disabled) return;
    const next = weekdays.map((row) =>
      row.weekday === weekday ? { ...row, isActive: !row.isActive } : row,
    );
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {weekdays.map((row) => {
          const label = WEEKDAY_LABEL[row.weekday] ?? String(row.weekday);
          const short = label.slice(0, 3).toUpperCase();
          return (
            <button
              key={row.weekday}
              type="button"
              disabled={disabled}
              onClick={() => toggle(row.weekday)}
              className={cn(
                "rounded-lg border px-3 py-2 font-brand text-[10px] tracking-[0.12em] transition",
                row.isActive
                  ? "border-gold/40 bg-gold/15 text-gold"
                  : "border-gold/15 bg-black/20 text-foreground/55 hover:border-gold/30 hover:text-foreground/80",
                disabled && "cursor-not-allowed opacity-50",
              )}
              aria-pressed={row.isActive}
            >
              {short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
