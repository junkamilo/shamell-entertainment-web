import { formatDateDisplayUs } from "@/lib/contactLogisticsUtils";
import type { OnComingEventSchedule } from "../services/fetchOnComingEventDetail";

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

export type ScheduleDisplayCopy = {
  daysTitle: string;
  daysLines: string[];
  weekdayChips: string[];
  timeRange: string;
  summary: string | null;
};

export function formatOnComingEventSchedule(
  schedule: OnComingEventSchedule | null,
): ScheduleDisplayCopy | null {
  if (!schedule) return null;

  if (schedule.mode === "FIXED_EVENT") {
    const lines: string[] = [];
    if (schedule.salesWindow) {
      lines.push(
        `Sales: ${formatDateDisplayUs(schedule.salesWindow.start)} – ${formatDateDisplayUs(schedule.salesWindow.end)}`,
      );
    }
    if (schedule.eventDate) {
      lines.push(`Event date: ${formatDateDisplayUs(schedule.eventDate)}`);
    }
    return {
      daysTitle: "Dates",
      daysLines: lines,
      weekdayChips: [],
      timeRange: formatTimeRange(schedule.startTime, schedule.endTime),
      summary: schedule.summary || null,
    };
  }

  const fromLine =
    schedule.effectiveFrom ?
      `From ${formatDateDisplayUs(schedule.effectiveFrom)}`
    : "Weekly schedule";

  return {
    daysTitle: "Days",
    daysLines: [fromLine],
    weekdayChips: schedule.weekdayLabels,
    timeRange: formatTimeRange(schedule.startTime, schedule.endTime),
    summary: schedule.summary || null,
  };
}
