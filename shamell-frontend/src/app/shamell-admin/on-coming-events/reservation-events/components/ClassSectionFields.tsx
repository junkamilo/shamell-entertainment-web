"use client";

import { Trash2 } from "lucide-react";
import { fieldLabelClass } from "@/app/shamell-admin/agenda/shared/lib/agendaFormStyles";

/** Keeps paired grid fields aligned when one label wraps to two lines. */
const pairedFieldLabelClass = `${fieldLabelClass} block min-h-11 leading-snug`;
import { formatTimeDisplayUs } from "@/lib/contactLogisticsUtils";
import type { ClassSectionBlueprint } from "../lib/recurringClassSectionsBulk.util";

type Props = {
  section: ClassSectionBlueprint;
  sectionIndex: number;
  showRemove: boolean;
  disabled?: boolean;
  onPatch: (patch: Partial<ClassSectionBlueprint>) => void;
  onRemove?: () => void;
  onPickTime: (field: "start" | "end") => void;
};

export function ClassSectionFields({
  section,
  sectionIndex,
  showRemove,
  disabled,
  onPatch,
  onRemove,
  onPickTime,
}: Props) {
  return (
    <div className="rounded border border-white/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-foreground/50">
          Section {sectionIndex + 1}
        </span>
        {showRemove && onRemove ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="text-foreground/50 hover:text-red-400 disabled:opacity-40"
            aria-label={`Remove section ${sectionIndex + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={`${fieldLabelClass} block`}>Label</span>
          <input
            value={section.label}
            disabled={disabled}
            placeholder="e.g. Morning class"
            onChange={(e) => onPatch({ label: e.target.value })}
            className="mt-1 w-full rounded border border-gold/20 bg-black/30 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPickTime("start")}
          className="rounded border border-gold/20 px-2 py-2 text-left text-sm hover:border-gold/40"
        >
          <span className={`${fieldLabelClass} block`}>Start</span>
          {formatTimeDisplayUs(section.startTime) || "Choose"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPickTime("end")}
          className="rounded border border-gold/20 px-2 py-2 text-left text-sm hover:border-gold/40"
        >
          <span className={`${fieldLabelClass} block`}>End</span>
          {formatTimeDisplayUs(section.endTime) || "Choose"}
        </button>
        <label className="block">
          <span className={pairedFieldLabelClass}>Capacity</span>
          <input
            type="number"
            min={1}
            step={1}
            disabled={disabled}
            placeholder="e.g. 20"
            value={section.defaultCapacity}
            onChange={(e) => onPatch({ defaultCapacity: e.target.value })}
            className="mt-1 w-full rounded border border-gold/20 bg-black/30 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className={pairedFieldLabelClass}>Section price (USD)</span>
          <input
            type="number"
            min={0.5}
            step={0.01}
            disabled={disabled}
            placeholder="e.g. 25.00"
            value={section.defaultPrice}
            onChange={(e) => onPatch({ defaultPrice: e.target.value })}
            className="mt-1 w-full rounded border border-gold/20 bg-black/30 px-2 py-1.5 text-sm"
          />
          <span className="mt-1 block text-[10px] text-foreground/50">
            Required. This is the price charged for each class in this section.
          </span>
        </label>
      </div>
    </div>
  );
}
