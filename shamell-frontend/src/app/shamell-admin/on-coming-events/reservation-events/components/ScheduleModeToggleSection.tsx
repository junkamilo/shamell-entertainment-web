"use client";

import { cn } from "@/lib/utils";

export const RESERVATION_SCHEDULE_MODE_RADIO_NAME = "reservationEventScheduleMode";

type Props = {
  title: string;
  description: string;
  modeValue: string;
  active: boolean;
  onSelect: () => void;
  children: React.ReactNode;
};

export function ScheduleModeToggleSection({
  title,
  description,
  modeValue,
  active,
  onSelect,
  children,
}: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border p-4 transition-colors",
        active ? "border-gold/35 bg-gold/5" : "border-gold/12 bg-black/15",
      )}
    >
      <label
        className={cn(
          "mb-4 flex cursor-pointer flex-wrap items-start justify-between gap-3 rounded-lg p-1 -m-1",
          !active && "hover:bg-gold/5",
        )}
      >
        <div className="min-w-0 flex-1 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-brand text-xs tracking-[0.14em] text-gold">{title}</h3>
            {active ? (
              <span className="rounded-full border border-gold/30 bg-gold/15 px-2 py-0.5 font-brand text-[9px] tracking-wider text-gold">
                Active
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-foreground/65">{description}</p>
          {!active ? (
            <p className="mt-2 text-[10px] uppercase tracking-wider text-foreground/45">
              Tap Activate to edit this schedule
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "relative inline-flex h-9 w-[4.5rem] shrink-0 items-center rounded-full border transition-colors",
            active ? "border-gold/50 bg-gold/25" : "border-gold/20 bg-black/30",
          )}
          aria-hidden
        >
          <span
            className={cn(
              "inline-block h-7 w-7 rounded-full bg-gold shadow transition-transform",
              active ? "translate-x-8" : "translate-x-1",
            )}
          />
        </span>
        <input
          type="radio"
          name={RESERVATION_SCHEDULE_MODE_RADIO_NAME}
          value={modeValue}
          checked={active}
          onChange={onSelect}
          className="sr-only"
        />
        <span className="sr-only">Activate {title}</span>
      </label>
      <div className={cn(!active && "pointer-events-none opacity-50")}>{children}</div>
    </section>
  );
}
