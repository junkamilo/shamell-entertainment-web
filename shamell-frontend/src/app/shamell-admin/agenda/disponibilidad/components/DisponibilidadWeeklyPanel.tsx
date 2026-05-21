import { type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { PublicWeeklySlot } from "@/lib/bookingAvailability";
import type { AdminAvailabilitySnapshot, TimePickerTarget } from "../types/disponibilidad.types";
import DisponibilidadWeeklyRow from "./DisponibilidadWeeklyRow";

type Props = {
  snapshot: AdminAvailabilitySnapshot | null;
  isLoading: boolean;
  error: string | null;
  rows: PublicWeeklySlot[];
  savingWeekly: boolean;
  onSaveWeekly: (e: FormEvent) => void;
  onReload: () => void;
  onRowClosedChange: (weekday: number, isClosed: boolean) => void;
  onOpenTimePicker: (target: TimePickerTarget) => void;
};

export default function DisponibilidadWeeklyPanel({
  snapshot,
  isLoading,
  error,
  rows,
  savingWeekly,
  onSaveWeekly,
  onReload,
  onRowClosedChange,
  onOpenTimePicker,
}: Props) {
  return (
    <motion.section
      key="avail-weekly"
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      className="shamell-glass-surface mb-10 overflow-visible rounded-2xl p-4 sm:p-5 md:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/10 pb-4">
        <h2 className="font-brand text-[11px] tracking-[0.18em] text-gold">WEEKLY HOURS</h2>
        {error ? <span className="text-xs text-red-300">{error}</span> : null}
      </div>

      {isLoading && !snapshot ? (
        <div className="flex justify-center py-12 text-gold">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <form onSubmit={onSaveWeekly} className="mt-6 space-y-4">
          {rows.map((row) => (
            <DisponibilidadWeeklyRow
              key={row.weekday}
              row={row}
              onClosedChange={onRowClosedChange}
              onOpenTimePicker={onOpenTimePicker}
            />
          ))}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="submit"
              disabled={savingWeekly}
              className="w-full rounded-full border border-gold/35 px-5 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50 sm:w-auto sm:py-2"
            >
              {savingWeekly ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
              SAVE HOURS
            </button>
            <button
              type="button"
              onClick={onReload}
              className="w-full rounded-full border border-gold/15 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/30 hover:text-gold sm:w-auto sm:py-2"
            >
              RELOAD
            </button>
          </div>
        </form>
      )}
    </motion.section>
  );
}
