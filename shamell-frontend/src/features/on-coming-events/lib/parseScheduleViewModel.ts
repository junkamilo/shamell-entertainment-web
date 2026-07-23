import {
  formatDateDisplayUs,
  hhmmToMinutes,
  parseISOLocal,
  toISOLocalDate,
} from "@/lib/contactLogisticsUtils";
import type { OnComingEventSchedule } from "../services/fetchOnComingEventDetail";

export type TimeArcSegment = {
  startMinutes: number;
  endMinutes: number;
  label: string | null;
};

export type ScheduleDaySummary = {
  weekday: number;
  label: string;
  sectionCount: number;
  sections: Array<{
    label: string | null;
    timeRange: string;
  }>;
};

const LABEL_TO_WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function weekdayLabelsToIndices(labels: string[]): number[] {
  const set = new Set<number>();
  for (const label of labels) {
    const idx = LABEL_TO_WEEKDAY[label.trim()];
    if (idx !== undefined) set.add(idx);
  }
  return [...set].sort((a, b) => a - b);
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  const fmt = (hhmm: string) => {
    if (!/^\d{2}:\d{2}$/.test(hhmm.trim())) return hhmm;
    const [hs, ms] = hhmm.split(":");
    const d = new Date();
    d.setHours(Number(hs), Number(ms), 0, 0);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? fmt(start) : end ? fmt(end) : "";
}

export function formatDurationFromMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function durationTotalMinutes(
  startMinutes: number | null,
  endMinutes: number | null,
): number | null {
  if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
    return null;
  }
  return endMinutes - startMinutes;
}

function formatDuration(startMinutes: number | null, endMinutes: number | null): string | null {
  const total = durationTotalMinutes(startMinutes, endMinutes);
  if (total == null) return null;
  return formatDurationFromMinutes(total);
}

function formatTimezoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "long",
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    return name ?? tz;
  } catch {
    return tz;
  }
}

export type ScheduleViewModel = {
  mode: "FIXED_EVENT" | "RECURRING_WEEKLY";
  timezone: string;
  timezoneLabel: string;
  activeWeekdays: number[];
  anchorDate: string | null;
  eventDate: string | null;
  salesWindow: { start: string; end: string } | null;
  startTime: string | null;
  endTime: string | null;
  startMinutes: number | null;
  endMinutes: number | null;
  timeRangeLabel: string;
  durationLabel: string | null;
  durationTotalMinutes: number | null;
  humanLines: string[];
  timeArcs: TimeArcSegment[];
  daySummaries: ScheduleDaySummary[];
};

export function parseScheduleViewModel(
  schedule: OnComingEventSchedule | null,
): ScheduleViewModel | null {
  if (!schedule) return null;

  const startMinutes =
    schedule.startTime ? hhmmToMinutes(schedule.startTime) : null;
  const endMinutes = schedule.endTime ? hhmmToMinutes(schedule.endTime) : null;
  const timeRangeLabel = formatTimeRange(schedule.startTime, schedule.endTime);
  const durationLabel = formatDuration(startMinutes, endMinutes);
  const totalMinutes = durationTotalMinutes(startMinutes, endMinutes);
  const timezoneLabel = formatTimezoneLabel(schedule.timezone);

  let timeArcs: TimeArcSegment[] = [];
  if (schedule.mode === "RECURRING_WEEKLY" && schedule.days.length > 0) {
    const seen = new Set<string>();
    for (const day of schedule.days) {
      for (const sec of day.sections) {
        const sm = hhmmToMinutes(sec.startTime);
        const em = hhmmToMinutes(sec.endTime);
        if (sm == null || em == null || em <= sm) continue;
        const key = `${sm}-${em}`;
        if (seen.has(key)) continue;
        seen.add(key);
        timeArcs.push({
          startMinutes: sm,
          endMinutes: em,
          label: sec.label ?? day.label,
        });
      }
    }
    timeArcs.sort((a, b) => a.startMinutes - b.startMinutes);
  } else if (startMinutes != null && endMinutes != null && endMinutes > startMinutes) {
    timeArcs = [{ startMinutes, endMinutes, label: null }];
  }

  if (schedule.mode === "FIXED_EVENT") {
    const humanLines: string[] = [];
    if (schedule.salesWindow) {
      humanLines.push(
        `Ticket sales ${formatDateDisplayUs(schedule.salesWindow.start)} – ${formatDateDisplayUs(schedule.salesWindow.end)}`,
      );
    }
    if (schedule.eventDate) {
      humanLines.push(`Event on ${formatDateDisplayUs(schedule.eventDate)}`);
    }
    return {
      mode: "FIXED_EVENT",
      timezone: schedule.timezone,
      timezoneLabel,
      activeWeekdays: [],
      anchorDate: schedule.eventDate ?? schedule.salesWindow?.start ?? null,
      eventDate: schedule.eventDate,
      salesWindow: schedule.salesWindow,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      startMinutes,
      endMinutes,
      timeRangeLabel,
      durationLabel,
      durationTotalMinutes: totalMinutes,
      humanLines,
      timeArcs,
      daySummaries: [],
    };
  }

  const activeWeekdays = weekdayLabelsToIndices(schedule.weekdayLabels);
  const daySummaries: ScheduleDaySummary[] = schedule.days.map((day) => ({
    weekday: day.weekday,
    label: day.label,
    sectionCount: day.sections.length,
    sections: day.sections.map((sec) => ({
      label: sec.label,
      timeRange: formatTimeRange(sec.startTime, sec.endTime),
    })),
  }));
  const humanLines: string[] = [];
  if (schedule.effectiveFrom) {
    humanLines.push(`Weekly from ${formatDateDisplayUs(schedule.effectiveFrom)}`);
  } else {
    humanLines.push("Weekly schedule");
  }
  if (schedule.weekdayLabels.length > 0) {
    humanLines.push(`Every ${schedule.weekdayLabels.join(", ")}`);
  }
  if (timeArcs.length > 1) {
    humanLines.push(
      `${timeArcs.length} time sections across the week`,
    );
  }

  return {
    mode: "RECURRING_WEEKLY",
    timezone: schedule.timezone,
    timezoneLabel,
    activeWeekdays,
    anchorDate: schedule.effectiveFrom ?? toISOLocalDate(new Date()),
    eventDate: null,
    salesWindow: null,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    startMinutes,
    endMinutes,
    timeRangeLabel,
    durationLabel,
    durationTotalMinutes: totalMinutes,
    humanLines,
    timeArcs,
    daySummaries,
  };
}

export function formatOccurrenceDate(iso: string): string {
  const d = parseISOLocal(iso);
  if (!d) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
