import { type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import AdminAccordionSingleSelect from "@/components/admin/AdminAccordionSingleSelect";
import {
  CLOSURE_KIND_OPTIONS,
  CLOSURE_WEEKDAY_OPTIONS,
} from "../lib/disponibilidadConstants";
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
        <span className="font-brand text-[10px] tracking-widest text-gold/65">TYPE</span>
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
          <span className="font-brand text-[10px] tracking-widest text-gold/65">DATE</span>
          <input type="hidden" required value={closureDate} readOnly />
          <button
            type="button"
            onClick={() => onOpenDatePicker("single")}
            className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
          >
            {closureDate || "Choose date"}
          </button>
        </label>
      ) : closureKind === "DATE_RANGE" ? (
        <>
          <label className="block">
            <span className="font-brand text-[10px] tracking-widest text-gold/65">FROM</span>
            <input type="hidden" required value={closureStartDate} readOnly />
            <button
              type="button"
              onClick={() => onOpenDatePicker("start")}
              className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
            >
              {closureStartDate || "Choose start date"}
            </button>
          </label>
          <label className="block">
            <span className="font-brand text-[10px] tracking-widest text-gold/65">THROUGH</span>
            <input type="hidden" required value={closureEndDate} readOnly />
            <button
              type="button"
              onClick={() => onOpenDatePicker("end")}
              className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
            >
              {closureEndDate || "Choose end date"}
            </button>
          </label>
        </>
      ) : (
        <label className="block md:col-span-2">
          <span className="font-brand text-[10px] tracking-widest text-gold/65">DAY OF WEEK</span>
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
        <span className="font-brand text-[10px] tracking-widest text-gold/65">NOTE (OPTIONAL)</span>
        <input
          type="text"
          value={closureNote}
          onChange={(e) => onClosureNoteChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 font-body text-sm text-foreground outline-none focus:border-gold"
          placeholder="e.g. Travel, holiday"
        />
      </label>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={addingClosure}
          className="w-full rounded-full border border-gold/35 px-5 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50 sm:w-auto sm:py-2"
        >
          {addingClosure ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
          ADD CLOSURE
        </button>
      </div>
    </form>
  );
}
