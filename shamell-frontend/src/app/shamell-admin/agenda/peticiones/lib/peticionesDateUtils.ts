export function formatRequestDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function formatEventCalendarDate(raw: string): string {
  const ymd = raw.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return formatRequestDate(raw);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return formatRequestDate(raw);
  }
  const stable = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(stable);
}

export function formatBookingCalendarDate(raw: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: tz }).format(
      new Date(raw),
    );
  } catch {
    return formatEventCalendarDate(raw);
  }
}

export function isoDateFromInstantInTimeZone(instantIso: string, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instantIso));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return /^\d{4}$/.test(year) && /^\d{2}$/.test(month) && /^\d{2}$/.test(day)
    ? `${year}-${month}-${day}`
    : instantIso.slice(0, 10);
}

export function hhmmFromBookingDate(eventDate: string, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(eventDate));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function bookingTimeZone(): string {
  return process.env.NEXT_PUBLIC_BOOKING_TZ ?? "America/New_York";
}
