import { BadRequestException } from '@nestjs/common';

const WEEKDAY_FROM_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Wall-clock calendar + time in IANA timezone (for BOOKING_TZ). */
export function zonedWallClock(
  date: Date,
  timeZone: string,
): {
  dateISO: string;
  weekday: number;
  minutesSinceMidnight: number;
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(date);
  const g = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? '';
  const wdShort = g('weekday');
  const weekday = WEEKDAY_FROM_SHORT[wdShort];
  if (weekday === undefined) {
    throw new BadRequestException(
      'Could not resolve weekday for booking timezone.',
    );
  }
  const y = g('year');
  const m = g('month');
  const d = g('day');
  const dateISO = `${y}-${m}-${d}`;
  const hour = Number.parseInt(g('hour'), 10);
  const minute = Number.parseInt(g('minute'), 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new BadRequestException(
      'Could not resolve time for booking timezone.',
    );
  }
  return { dateISO, weekday, minutesSinceMidnight: hour * 60 + minute };
}

export function parseHHMM(hhmm: string, label: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) {
    throw new BadRequestException(`${label} must be HH:mm.`);
  }
  const h = Number.parseInt(m[1], 10);
  const min = Number.parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) {
    throw new BadRequestException(`${label} is out of range.`);
  }
  return h * 60 + min;
}

export function prismaDateToISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetweenIsoUtc(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((ta - tb) / 86400000);
}

/** Maps a calendar date + wall-clock minutes in `timeZone` to a UTC `Date` (iterative, DST-safe enough for booking checks). */
export function utcInstantForWallClock(
  dateISO: string,
  minutesSinceMidnight: number,
  timeZone: string,
): Date {
  const parts = dateISO.split('-').map(Number);
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    throw new BadRequestException('Invalid calendar date.');
  }
  let t = Date.UTC(y, mo - 1, d, 12, 0, 0);
  for (let i = 0; i < 24; i++) {
    const wall = zonedWallClock(new Date(t), timeZone);
    const dd = daysBetweenIsoUtc(dateISO, wall.dateISO);
    const dm = minutesSinceMidnight - wall.minutesSinceMidnight;
    if (dd === 0 && dm === 0) return new Date(t);
    t += dd * 86400000 + dm * 60000;
  }
  return new Date(t);
}
