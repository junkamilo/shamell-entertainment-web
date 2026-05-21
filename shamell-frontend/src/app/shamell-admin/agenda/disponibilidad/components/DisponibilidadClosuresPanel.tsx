import { type FormEvent } from "react";
import { motion } from "motion/react";
import type { AdminAvailabilitySnapshot, ClosureDatePickerTarget, ClosureKind } from "../types/disponibilidad.types";
import DisponibilidadClosureForm from "./DisponibilidadClosureForm";
import DisponibilidadClosuresList from "./DisponibilidadClosuresList";

type Props = {
  snapshot: AdminAvailabilitySnapshot | null;
  closureKind: ClosureKind;
  closureDate: string;
  closureStartDate: string;
  closureEndDate: string;
  closureWeekday: number;
  closureNote: string;
  addingClosure: boolean;
  onClosureKindChange: (id: string) => void;
  onClosureWeekdayChange: (id: string) => void;
  onClosureNoteChange: (value: string) => void;
  onOpenDatePicker: (target: ClosureDatePickerTarget) => void;
  onAddClosure: (e: FormEvent) => void;
  onRequestDelete: (id: string) => void;
};

export default function DisponibilidadClosuresPanel({
  snapshot,
  closureKind,
  closureDate,
  closureStartDate,
  closureEndDate,
  closureWeekday,
  closureNote,
  addingClosure,
  onClosureKindChange,
  onClosureWeekdayChange,
  onClosureNoteChange,
  onOpenDatePicker,
  onAddClosure,
  onRequestDelete,
}: Props) {
  return (
    <motion.section
      key="avail-closures"
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      className="shamell-glass-surface overflow-visible rounded-2xl p-4 sm:p-5 md:p-7"
    >
      <div className="border-b border-gold/10 pb-4">
        <h2 className="font-brand text-[10px] leading-snug tracking-[0.16em] text-gold sm:text-[11px] sm:tracking-[0.18em]">
          <span className="block sm:hidden">CLOSURES</span>
          <span className="hidden sm:block">CLOSURES (time off / single day / weekly recurring)</span>
        </h2>
        <p className="mt-1 font-body text-[11px] leading-relaxed text-foreground/50 sm:hidden">
          Single date, date range, or the same weekday every week.
        </p>
      </div>

      <DisponibilidadClosureForm
        closureKind={closureKind}
        closureDate={closureDate}
        closureStartDate={closureStartDate}
        closureEndDate={closureEndDate}
        closureWeekday={closureWeekday}
        closureNote={closureNote}
        addingClosure={addingClosure}
        onClosureKindChange={onClosureKindChange}
        onClosureWeekdayChange={onClosureWeekdayChange}
        onClosureNoteChange={onClosureNoteChange}
        onOpenDatePicker={onOpenDatePicker}
        onSubmit={onAddClosure}
      />

      <DisponibilidadClosuresList
        closures={snapshot?.closures ?? []}
        onRequestDelete={onRequestDelete}
      />
    </motion.section>
  );
}
