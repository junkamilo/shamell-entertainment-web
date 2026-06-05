import type { ClassSectionFormRow } from "../types/reservationEventTemplate.types";

/** Section template without weekday (shared across days). */
export type ClassSectionBlueprint = Omit<ClassSectionFormRow, "weekday">;

const HHMM_RE = /^(\d{2}):(\d{2})$/;

function parseHHMMToMinutes(value: string): number | null {
  const match = HHMM_RE.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function validateBlueprintOverlapMessage(
  blueprint: ClassSectionBlueprint[],
): string | null {
  const parsed: Array<{ index: number; start: number; end: number }> = [];
  for (let i = 0; i < blueprint.length; i++) {
    const s = blueprint[i]!;
    const start = parseHHMMToMinutes(s.startTime);
    const end = parseHHMMToMinutes(s.endTime);
    if (start == null || end == null) {
      return `Section ${i + 1}: use valid start and end times (HH:mm).`;
    }
    if (end <= start) {
      return `Section ${i + 1}: end time must be after start time.`;
    }
    parsed.push({ index: i, start, end });
  }
  parsed.sort((a, b) => a.start - b.start || a.end - b.end);
  for (let i = 1; i < parsed.length; i++) {
    const prev = parsed[i - 1]!;
    const curr = parsed[i]!;
    if (curr.start < prev.end) {
      return `Section ${curr.index + 1} overlaps section ${prev.index + 1}.`;
    }
  }
  return null;
}

export function validateBlueprintComplete(blueprint: ClassSectionBlueprint[]): string | null {
  if (blueprint.length === 0) return "Add at least one section to the shared setup.";
  for (let i = 0; i < blueprint.length; i++) {
    const s = blueprint[i]!;
    if (!s.startTime?.trim() || !s.endTime?.trim()) {
      return `Section ${i + 1}: set start and end times.`;
    }
  }
  return validateBlueprintOverlapMessage(blueprint);
}

function blueprintRowEqual(a: ClassSectionBlueprint, b: ClassSectionBlueprint): boolean {
  return (
    a.label.trim() === b.label.trim() &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.sortOrder === b.sortOrder &&
    a.defaultCapacity === b.defaultCapacity &&
    a.defaultPrice.trim() === b.defaultPrice.trim()
  );
}

export function sectionsToBlueprint(daySections: ClassSectionFormRow[]): ClassSectionBlueprint[] {
  return daySections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ weekday: _w, ...rest }) => rest);
}

export function sectionsMatchBlueprint(
  daySections: ClassSectionFormRow[],
  blueprint: ClassSectionBlueprint[],
): boolean {
  const a = sectionsToBlueprint(daySections);
  const b = blueprint.slice().sort((x, y) => x.sortOrder - y.sortOrder);
  if (a.length !== b.length) return false;
  return a.every((row, i) => blueprintRowEqual(row, b[i]!));
}

export function inferBlueprintFromActiveDays(
  sections: ClassSectionFormRow[],
  activeWeekdays: number[],
): ClassSectionBlueprint[] | null {
  if (activeWeekdays.length < 2) return null;
  const sorted = [...activeWeekdays].sort((a, b) => a - b);
  const firstDay = sectionsForWeekday(sections, sorted[0]!);
  if (firstDay.length === 0) return null;
  const blueprint = sectionsToBlueprint(firstDay);
  for (const wd of sorted.slice(1)) {
    const day = sectionsForWeekday(sections, wd);
    if (!sectionsMatchBlueprint(day, blueprint)) return null;
  }
  return blueprint;
}

export function defaultBlueprint(): ClassSectionBlueprint[] {
  return [
    {
      label: "Section 1",
      startTime: "10:00",
      endTime: "12:00",
      sortOrder: 0,
      defaultCapacity: 20,
      defaultPrice: "",
    },
  ];
}

function sectionsForWeekday(sections: ClassSectionFormRow[], weekday: number) {
  return sections
    .filter((s) => s.weekday === weekday)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function cloneBlueprintForWeekday(
  blueprint: ClassSectionBlueprint[],
  weekday: number,
): ClassSectionFormRow[] {
  return blueprint.map((row) => ({
    ...row,
    weekday,
  }));
}

export type ApplyBlueprintResult = {
  sections: ClassSectionFormRow[];
  filledWeekdays: number[];
  skippedWeekdays: number[];
  error: string | null;
};

export function applyBlueprintToWeekdays(
  sections: ClassSectionFormRow[],
  activeWeekdays: number[],
  blueprint: ClassSectionBlueprint[],
  mode: "fill_empty" | "replace_all",
): ApplyBlueprintResult {
  const validationError = validateBlueprintComplete(blueprint);
  if (validationError) {
    return {
      sections,
      filledWeekdays: [],
      skippedWeekdays: [],
      error: validationError,
    };
  }

  const filledWeekdays: number[] = [];
  const skippedWeekdays: number[] = [];
  let next = sections.filter((s) => !activeWeekdays.includes(s.weekday));

  for (const wd of [...activeWeekdays].sort((a, b) => a - b)) {
    const existing = sectionsForWeekday(sections, wd);
    if (mode === "fill_empty" && existing.length > 0) {
      next = [...next, ...existing];
      skippedWeekdays.push(wd);
      continue;
    }
    next = [...next, ...cloneBlueprintForWeekday(blueprint, wd)];
    filledWeekdays.push(wd);
  }

  return { sections: next, filledWeekdays, skippedWeekdays, error: null };
}
