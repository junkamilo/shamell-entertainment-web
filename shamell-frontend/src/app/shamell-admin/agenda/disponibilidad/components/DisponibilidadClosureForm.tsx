import { type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import AdminAccordionSingleSelect from "@/components/admin/AdminAccordionSingleSelect";
import {
  CLOSURE_KIND_OPTIONS,
  CLOSURE_WEEKDAY_OPTIONS,
} from "../lib/disponibilidadConstants";
import {
  disponibilidadActionButtonClass,
  disponibilidadFieldLabelClass,
  disponibilidadTimeTriggerClass,
} from "../lib/disponibilidadStyles";
import type { ClosureDatePickerTarget, ClosureKind } from "../types/disponibilidad.types";

type Props = {
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
  onSubmit: (e: FormEvent) => void;
};

export default function DisponibilidadClosureForm({
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
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 overflow-visible md:grid-cols-2">
      <label className="block overflow-visible md:col-span-2">
        <span className={disponibilidadFieldLabelClass}>TYPE</span>
        <AdminAccordionSingleSelect
          options={CLOSURE_KIND_OPTIONS}
          value={closureKind}
          onChange={onClosureKindChange}
          className="mt-2"
          showNoneOption={false}
          ariaLabel="Select closure type"
        />
      </label>
      {closureKind === "SPECIFIC_DATE" ? (
        <label className="block">
          <span className={disponibilidadFieldLabelClass}>DATE</span>
          <input type="hidden" required value={closureDate} readOnly />
          <button
            type="button"
            onClick={() => onOpenDatePicker("single")}
            className={`mt-2 ${disponibilidadTimeTriggerClass}`}
          >
            {closureDate || "Choose date"}
          </button>
        </label>
      ) : closureKind === "DATE_RANGE" ? (
        <>
          <label className="block">
            <span className={disponibilidadFieldLabelClass}>FROM</span>
            <input type="hidden" required value={closureStartDate} readOnly />
            <button
              type="button"
              onClick={() => onOpenDatePicker("start")}
              className={`mt-2 ${disponibilidadTimeTriggerClass}`}
            >
              {closureStartDate || "Choose start date"}
            </button>
          </label>
          <label className="block">
            <span className={disponibilidadFieldLabelClass}>THROUGH</span>
            <input type="hidden" required value={closureEndDate} readOnly />
            <button
              type="button"
              onClick={() => onOpenDatePicker("end")}
              className={`mt-2 ${disponibilidadTimeTriggerClass}`}
            >
              {closureEndDate || "Choose end date"}
            </button>
          </label>
        </>
      ) : (
        <label className="block md:col-span-2">
          <span className={disponibilidadFieldLabelClass}>DAY OF WEEK</span>
          <AdminAccordionSingleSelect
            options={CLOSURE_WEEKDAY_OPTIONS}
            value={String(closureWeekday)}
            onChange={onClosureWeekdayChange}
            className="mt-2"
            showNoneOption={false}
            ariaLabel="Select day of week for recurring closure"
          />
        </label>
      )}
      <label className="block md:col-span-2">
        <span className={disponibilidadFieldLabelClass}>NOTE (OPTIONAL)</span>
        <input
          type="text"
          value={closureNote}
          onChange={(e) => onClosureNoteChange(e.target.value)}
          className="mt-2 min-h-[44px] w-full rounded-lg border border-gold/25 px-3 py-2.5 font-body text-sm text-foreground outline-none focus:border-gold sm:text-base"
          placeholder="e.g. Travel, holiday"
        />
      </label>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={addingClosure}
          className={disponibilidadActionButtonClass}
        >
          {addingClosure ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
          ADD CLOSURE
        </button>
      </div>
    </form>
  );
}
