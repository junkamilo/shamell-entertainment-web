"use client";

import { Modal } from "@/components/admin/overlays";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  applyBlueprintToWeekdays,
  validateBlueprintComplete,
  type ClassSectionBlueprint,
} from "../lib/recurringClassSectionsBulk.util";
import type { ClassSectionFormRow } from "../types/reservationEventTemplate.types";
import { ClassSectionFields } from "./ClassSectionFields";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const BULK_SECTION_WEEKDAY = -1;

type Props = {
  activeWeekdays: number[];
  sections: ClassSectionFormRow[];
  disabled?: boolean;
  onApply: (sections: ClassSectionFormRow[], message: string | null) => void;
  onPickTime: (sortOrder: number, field: "start" | "end") => void;
  blueprint: ClassSectionBlueprint[];
  onBlueprintChange: (blueprint: ClassSectionBlueprint[]) => void;
};

export function RecurringClassBulkSectionsEditor({
  activeWeekdays,
  sections,
  disabled,
  onApply,
  onPickTime,
  blueprint,
  onBlueprintChange,
}: Props) {
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);

  const dayLabels = useMemo(
    () =>
      [...activeWeekdays]
        .sort((a, b) => a - b)
        .map((wd) => WEEKDAY_LABELS[wd] ?? String(wd))
        .join(", "),
    [activeWeekdays],
  );

  const emptyActiveDays = useMemo(
    () =>
      activeWeekdays.filter(
        (wd) => !sections.some((s) => s.weekday === wd),
      ),
    [activeWeekdays, sections],
  );

  const patchBlueprint = (sortOrder: number, patch: Partial<ClassSectionBlueprint>) => {
    onBlueprintChange(
      blueprint.map((s) => (s.sortOrder === sortOrder ? { ...s, ...patch } : s)),
    );
    setApplyMessage(null);
  };

  const addSection = () => {
    const nextSort =
      blueprint.length > 0 ? Math.max(...blueprint.map((s) => s.sortOrder)) + 1 : 0;
    onBlueprintChange([
      ...blueprint,
      {
        label: "",
        startTime: "10:00",
        endTime: "12:00",
        sortOrder: nextSort,
        defaultCapacity: "",
        defaultPrice: "",
      },
    ]);
  };

  const removeSection = (sortOrder: number) => {
    const next = blueprint
      .filter((s) => s.sortOrder !== sortOrder)
      .map((s, i) => ({ ...s, sortOrder: i }));
    onBlueprintChange(next);
  };

  const blueprintIncomplete = validateBlueprintComplete(blueprint) != null;

  const runApply = (mode: "fill_empty" | "replace_all") => {
    const result = applyBlueprintToWeekdays(sections, activeWeekdays, blueprint, mode);
    if (result.error) {
      setApplyMessage(result.error);
      return;
    }
    let msg: string | null = null;
    if (result.filledWeekdays.length === 0 && mode === "fill_empty") {
      msg =
        "No empty days to fill. All active days already have sections, or use overwrite below.";
    } else if (mode === "fill_empty") {
      const filled = result.filledWeekdays
        .map((wd) => WEEKDAY_LABELS[wd] ?? wd)
        .join(", ");
      const skipped =
        result.skippedWeekdays.length > 0
          ? ` Skipped (already configured): ${result.skippedWeekdays.map((wd) => WEEKDAY_LABELS[wd] ?? wd).join(", ")}.`
          : "";
      msg = `Applied to ${filled}.${skipped}`;
    } else {
      msg = `Replaced sections on all active days (${dayLabels}).`;
    }
    setApplyMessage(msg);
    setOverwriteModalOpen(false);
    onApply(result.sections, msg);
  };

  if (activeWeekdays.length < 2) return null;

  return (
    <div className="rounded-lg border border-gold/25 bg-gold/5 p-3">
      <div className="mb-2">
        <h4 className="font-brand text-[10px] tracking-[0.14em] text-gold">
          SHARED SETUP ({dayLabels.toUpperCase()})
        </h4>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-foreground/50">
          {blueprint.length} template section{blueprint.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={addSection}
          className="inline-flex items-center gap-1 rounded border border-gold/25 px-2 py-1 text-[10px] text-gold hover:border-gold/45 disabled:opacity-50"
        >
          <Plus className="h-3 w-3" aria-hidden />
          Add section
        </button>
      </div>

      <div className="space-y-3">
        {blueprint
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((section, index) => (
            <ClassSectionFields
              key={section.sortOrder}
              section={section}
              sectionIndex={index}
              showRemove={blueprint.length > 1}
              disabled={disabled}
              onPatch={(patch) => patchBlueprint(section.sortOrder, patch)}
              onRemove={() => removeSection(section.sortOrder)}
              onPickTime={(field) => onPickTime(section.sortOrder, field)}
            />
          ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={disabled || blueprintIncomplete || emptyActiveDays.length === 0}
          onClick={() => runApply("fill_empty")}
          className="rounded-lg border border-gold/35 bg-gold/10 px-3 py-2 font-brand text-[10px] tracking-[0.12em] text-gold uppercase hover:bg-gold/15 disabled:opacity-50"
        >
          Apply to days without sections
        </button>
        <button
          type="button"
          disabled={disabled || blueprintIncomplete}
          onClick={() => setOverwriteModalOpen(true)}
          className="rounded-lg border border-white/15 px-3 py-2 text-[10px] text-foreground/65 hover:border-gold/30 hover:text-gold disabled:opacity-50"
        >
          Apply to all active days (overwrite)
        </button>
      </div>
      {blueprintIncomplete ? (
        <p className="mt-2 text-[11px] text-foreground/55">
          Fill label, times, capacity, and price on every template section to enable the
          apply buttons.
        </p>
      ) : null}

      <Modal
        title="Overwrite all active days?"
        isOpen={overwriteModalOpen}
        onClose={() => setOverwriteModalOpen(false)}
        size="narrow"
      >
        <div className="space-y-8">
          <div className="admin-delete-confirm-body space-y-4">
            <p>
              This will replace existing sections on{" "}
              <span className="admin-delete-confirm-highlight font-body font-semibold text-gold normal-case">
                {dayLabels}
              </span>{" "}
              with the template sections above. Days that already have custom sections will be
              overwritten.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOverwriteModalOpen(false)}
              disabled={disabled}
              className="admin-delete-confirm-btn rounded-xl border border-gold/30 px-6 py-3.5 tracking-[0.06em] text-foreground/90 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => runApply("replace_all")}
              disabled={disabled}
              className="admin-delete-confirm-btn rounded-xl border border-amber-400/45 bg-amber-500/15 px-6 py-3.5 font-brand tracking-[0.08em] text-amber-100 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirm overwrite
            </button>
          </div>
        </div>
      </Modal>

      {applyMessage ? (
        <p className="mt-2 text-xs text-foreground/70" role="status">
          {applyMessage}
        </p>
      ) : null}
    </div>
  );
}
