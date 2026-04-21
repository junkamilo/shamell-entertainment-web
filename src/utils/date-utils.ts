export function isDateInPast(dateString: string): boolean {
  return new Date(dateString) < new Date();
}

export function isDateInFuture(dateString: string): boolean {
  return new Date(dateString) > new Date();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getDaysBetween(start: string, end: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / msPerDay
  );
}
