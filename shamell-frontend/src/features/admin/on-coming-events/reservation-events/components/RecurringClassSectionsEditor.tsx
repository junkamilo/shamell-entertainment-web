"use client";

import { Plus } from "lucide-react";
import {
  sectionsMatchBlueprint,
  sectionsToBlueprint,
  type ClassSectionBlueprint,
} from "../lib/recurringClassSectionsBulk.util";
import type { ClassSectionFormRow } from "../types/reservationEventTemplate.types";
import { ClassSectionFields } from "./ClassSectionFields";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  activeWeekdays: number[];
  sections: ClassSectionFormRow[];
  disabled?: boolean;
  sharedBlueprint?: ClassSectionBlueprint[] | null;
  showSharedHint?: boolean;
  onChange: (sections: ClassSectionFormRow[]) => void;
  onPickTime: (weekday: number, sortOrder: number, field: "start" | "end") => void;
};

export function RecurringClassSectionsEditor({
  activeWeekdays,
  sections,
  disabled,
  sharedBlueprint = null,
  showSharedHint = false,
  onChange,
  onPickTime,
}: Props) {
  const sectionsForDay = (weekday: number) =>
    sections
      .filter((s) => s.weekday === weekday)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const updateDay = (weekday: number, nextDaySections: ClassSectionFormRow[]) => {
    const other = sections.filter((s) => s.weekday !== weekday);
    onChange([...other, ...nextDaySections]);
  };

  const addSection = (weekday: number) => {
    const day = sectionsForDay(weekday);
    const nextSort = day.length > 0 ? Math.max(...day.map((s) => s.sortOrder)) + 1 : 0;
    updateDay(weekday, [
      ...day,
      {
        weekday,
        label: "",
        startTime: "10:00",
        endTime: "12:00",
        sortOrder: nextSort,
        defaultCapacity: "",
        defaultPrice: "",
      },
    ]);
  };

  const removeSection = (weekday: number, sortOrder: number) => {
    const day = sectionsForDay(weekday).filter((s) => s.sortOrder !== sortOrder);
    updateDay(
      weekday,
      day.map((s, i) => ({ ...s, sortOrder: i })),
    );
  };

  const patchSection = (
    weekday: number,
    sortOrder: number,
    patch: Partial<ClassSectionFormRow>,
  ) => {
    updateDay(
      weekday,
      sectionsForDay(weekday).map((s) =>
        s.sortOrder === sortOrder ? { ...s, ...patch } : s,
      ),
    );
  };

  if (activeWeekdays.length === 0) {
    return (
      <p className="text-xs text-foreground/55">Select at least one weekday to configure sections.</p>
    );
  }

  return (
    <div className="space-y-3">
      {showSharedHint && activeWeekdays.length >= 2 ? (
        <p className="font-brand text-[10px] tracking-[0.12em] text-foreground/55">
          INDIVIDUAL DAY OVERRIDES
        </p>
      ) : null}
      {activeWeekdays.sort((a, b) => a - b).map((weekday) => {
        const daySections = sectionsForDay(weekday);
        const dayLabel = WEEKDAY_LABELS[weekday] ?? String(weekday);
        const matchesShared =
          sharedBlueprint &&
          sharedBlueprint.length > 0 &&
          daySections.length > 0 &&
          sectionsMatchBlueprint(daySections, sharedBlueprint);
        return (
          <div
            key={weekday}
            className="rounded-lg border border-gold/15 bg-black/25 p-3"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-brand text-[10px] tracking-[0.14em] text-gold">
                {dayLabel} — {daySections.length} section{daySections.length === 1 ? "" : "s"}
                {matchesShared ? (
                  <span className="ml-2 rounded border border-gold/20 px-1.5 py-0.5 text-[9px] tracking-normal text-foreground/60">
                    Matches shared setup
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => addSection(weekday)}
                className="inline-flex items-center gap-1 rounded border border-gold/25 px-2 py-1 text-[10px] text-gold hover:border-gold/45 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" aria-hidden />
                Add section
              </button>
            </div>
            {daySections.length === 0 ? (
              <p className="text-xs text-foreground/50">
                No sections yet. Use shared setup above or add a section here.
              </p>
            ) : (
              <div className="space-y-3">
                {daySections.map((section, index) => (
                  <ClassSectionFields
                    key={`${weekday}-${section.sortOrder}`}
                    section={sectionsToBlueprint([section])[0]!}
                    sectionIndex={index}
                    showRemove={daySections.length > 1}
                    disabled={disabled}
                    onPatch={(patch) => patchSection(weekday, section.sortOrder, patch)}
                    onRemove={() => removeSection(weekday, section.sortOrder)}
                    onPickTime={(field) => onPickTime(weekday, section.sortOrder, field)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
