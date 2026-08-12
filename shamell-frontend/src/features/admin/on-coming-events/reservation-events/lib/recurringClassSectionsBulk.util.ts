import type { ClassSectionFormRow } from "../types/reservationEventTemplate.types";

/** Section template without weekday (shared across days). */
export type ClassSectionBlueprint = Omit<ClassSectionFormRow, "weekday">;

export type SectionTimeBlockRange = {
  startMinutes: number;
  endMinutes: number;
};

const HHMM_RE = /^(\d{2}):(\d{2})$/;
const DAY_END_MINUTES = 24 * 60 - 1;

export function parseHHMMToMinutes(value: string): number | null {
  const match = HHMM_RE.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

type ParsedInterval = { sortOrder: number; index: number; start: number; end: number };

function parseSectionIntervals(
  sections: Array<{ sortOrder: number; startTime: string; endTime: string }>,
): { ok: ParsedInterval[]; error: string | null } {
  const parsed: ParsedInterval[] = [];
  const sorted = sections.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i]!;
    const start = parseHHMMToMinutes(s.startTime);
    const end = parseHHMMToMinutes(s.endTime);
    if (start == null || end == null) {
      return {
        ok: [],
        error: `Section ${i + 1}: use valid start and end times (HH:mm).`,
      };
    }
    if (end <= start) {
      return {
        ok: [],
        error: `Section ${i + 1}: end time must be after start time.`,
      };
    }
    parsed.push({ sortOrder: s.sortOrder, index: i, start, end });
  }
  return { ok: parsed, error: null };
}

function mergeBlockedRanges(
  ranges: SectionTimeBlockRange[],
): SectionTimeBlockRange[] {
  if (ranges.length === 0) return [];
  const sorted = ranges
    .filter((r) => r.endMinutes >= r.startMinutes)
    .slice()
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
  if (sorted.length === 0) return [];
  const out: SectionTimeBlockRange[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i]!;
    const last = out[out.length - 1]!;
    if (curr.startMinutes <= last.endMinutes + 1) {
      last.endMinutes = Math.max(last.endMinutes, curr.endMinutes);
    } else {
      out.push({ ...curr });
    }
  }
  return out;
}

/**
 * Ranges to disable in ContactTimePickerModal so a section cannot reclaim
 * another section's window (half-open [start, end) like backend overlap).
 */
export function blockedRangesForSectionTimePick(args: {
  field: "start" | "end";
  editingSortOrder: number;
  sections: Array<{ sortOrder: number; startTime: string; endTime: string }>;
}): SectionTimeBlockRange[] {
  const editing = args.sections.find((s) => s.sortOrder === args.editingSortOrder);
  const others = args.sections.filter((s) => s.sortOrder !== args.editingSortOrder);
  const otherIntervals: Array<{ start: number; end: number }> = [];
  for (const s of others) {
    const start = parseHHMMToMinutes(s.startTime);
    const end = parseHHMMToMinutes(s.endTime);
    if (start == null || end == null || end <= start) continue;
    otherIntervals.push({ start, end });
  }

  const ranges: SectionTimeBlockRange[] = [];

  if (args.field === "start") {
    for (const o of otherIntervals) {
      if (o.end - 1 >= o.start) {
        ranges.push({ startMinutes: o.start, endMinutes: o.end - 1 });
      }
    }
    const fixedEnd = editing ? parseHHMMToMinutes(editing.endTime) : null;
    if (fixedEnd != null) {
      for (const o of otherIntervals) {
        if (fixedEnd <= o.start) continue;
        const maxExclusive = Math.min(fixedEnd, o.end);
        if (maxExclusive > 0) {
          ranges.push({
            startMinutes: 0,
            endMinutes: maxExclusive - 1,
          });
        }
      }
    }
    return mergeBlockedRanges(ranges);
  }

  const fixedStart = editing ? parseHHMMToMinutes(editing.startTime) : null;
  if (fixedStart != null) {
    ranges.push({ startMinutes: 0, endMinutes: fixedStart });
    for (const o of otherIntervals) {
      if (fixedStart >= o.end) continue;
      if (o.start + 1 <= DAY_END_MINUTES) {
        ranges.push({
          startMinutes: o.start + 1,
          endMinutes: DAY_END_MINUTES,
        });
      }
    }
  } else {
    for (const o of otherIntervals) {
      if (o.end - 1 >= o.start) {
        ranges.push({ startMinutes: o.start, endMinutes: o.end - 1 });
      }
    }
  }
  return mergeBlockedRanges(ranges);
}

export function validateBlueprintOverlapMessage(
  blueprint: ClassSectionBlueprint[],
): string | null {
  const { ok: parsed, error } = parseSectionIntervals(blueprint);
  if (error) return error;
  const byStart = parsed.slice().sort((a, b) => a.start - b.start || a.end - b.end);
  for (let i = 1; i < byStart.length; i++) {
    const prev = byStart[i - 1]!;
    const curr = byStart[i]!;
    if (curr.start < prev.end) {
      return `Section ${curr.index + 1} overlaps section ${prev.index + 1}.`;
    }
  }
  return null;
}

/** Overlap only — ignores incomplete/invalid times (for live UI warnings). */
export function liveSectionsOverlapMessage(
  sections: Array<{ sortOrder: number; startTime: string; endTime: string }>,
): string | null {
  const ready = sections.filter((s) => {
    const start = parseHHMMToMinutes(s.startTime);
    const end = parseHHMMToMinutes(s.endTime);
    return start != null && end != null && end > start;
  });
  if (ready.length < 2) return null;
  return validateBlueprintOverlapMessage(
    ready.map((s) => ({
      label: "",
      startTime: s.startTime,
      endTime: s.endTime,
      sortOrder: s.sortOrder,
      defaultCapacity: "1",
      defaultPrice: "1",
    })),
  );
}

function minutesToHHMM(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Next free slot after existing sections (default 2h), or 10:00–12:00 if none. */
export function suggestNextSectionTimes(
  sections: Array<{ startTime: string; endTime: string }>,
  durationMinutes = 120,
): { startTime: string; endTime: string } {
  const intervals: Array<{ start: number; end: number }> = [];
  for (const s of sections) {
    const start = parseHHMMToMinutes(s.startTime);
    const end = parseHHMMToMinutes(s.endTime);
    if (start == null || end == null || end <= start) continue;
    intervals.push({ start, end });
  }
  if (intervals.length === 0) {
    return { startTime: "10:00", endTime: "12:00" };
  }
  const lastEnd = Math.max(...intervals.map((iv) => iv.end));
  if (lastEnd + durationMinutes <= 24 * 60) {
    return {
      startTime: minutesToHHMM(lastEnd),
      endTime: minutesToHHMM(lastEnd + durationMinutes),
    };
  }
  // Day is full after the last section — try earliest gap from midnight.
  intervals.sort((a, b) => a.start - b.start || a.end - b.end);
  let cursor = 0;
  for (const iv of intervals) {
    if (cursor + durationMinutes <= iv.start) {
      return {
        startTime: minutesToHHMM(cursor),
        endTime: minutesToHHMM(cursor + durationMinutes),
      };
    }
    cursor = Math.max(cursor, iv.end);
  }
  return { startTime: "10:00", endTime: "12:00" };
}

export function validateDaySectionsOverlapMessage(
  daySections: ClassSectionFormRow[],
  dayLabel?: string,
): string | null {
  const prefix = dayLabel ? `${dayLabel}: ` : "";
  const message = validateBlueprintOverlapMessage(sectionsToBlueprint(daySections));
  return message ? `${prefix}${message}` : null;
}

export function validateActiveDaysSectionsNoOverlap(
  classSections: ClassSectionFormRow[],
  activeWeekdays: number[],
  weekdayLabels: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
): string | null {
  for (const wd of [...activeWeekdays].sort((a, b) => a - b)) {
    const daySections = sectionsForWeekday(classSections, wd);
    if (daySections.length === 0) continue;
    const label = weekdayLabels[wd] ?? `Day ${wd}`;
    const err = validateDaySectionsOverlapMessage(daySections, label);
    if (err) return err;
  }
  return null;
}

export function validateBlueprintComplete(blueprint: ClassSectionBlueprint[]): string | null {
  if (blueprint.length === 0) return "Add at least one section to the shared setup.";
  for (let i = 0; i < blueprint.length; i++) {
    const s = blueprint[i]!;
    if (!s.label.trim()) {
      return `Section ${i + 1}: the label is required.`;
    }
    if (!s.startTime?.trim() || !s.endTime?.trim()) {
      return `Section ${i + 1}: set start and end times.`;
    }
    const capacityRaw = s.defaultCapacity.trim();
    const capacity = Number.parseInt(capacityRaw, 10);
    if (!capacityRaw || !Number.isInteger(capacity) || capacity < 1) {
      return `Section ${i + 1}: capacity must be at least 1.`;
    }
    const priceRaw = s.defaultPrice.trim();
    const price = Number.parseFloat(priceRaw);
    if (!priceRaw || !Number.isFinite(price) || price < 0.5) {
      return `Section ${i + 1}: set a class price of at least $0.50.`;
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
    a.defaultCapacity.trim() === b.defaultCapacity.trim() &&
    a.defaultPrice.trim() === b.defaultPrice.trim()
  );
}

export function sectionsToBlueprint(daySections: ClassSectionFormRow[]): ClassSectionBlueprint[] {
  return daySections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({
      label: row.label,
      startTime: row.startTime,
      endTime: row.endTime,
      sortOrder: row.sortOrder,
      defaultCapacity: row.defaultCapacity,
      defaultPrice: row.defaultPrice,
    }));
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
      label: "",
      startTime: "10:00",
      endTime: "12:00",
      sortOrder: 0,
      defaultCapacity: "",
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
