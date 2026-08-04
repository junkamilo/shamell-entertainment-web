export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

export function parseTarget(targetAt: string | Date): number {
  const ms = targetAt instanceof Date ? targetAt.getTime() : Date.parse(targetAt);
  return Number.isFinite(ms) ? ms : NaN;
}

export function computeParts(targetMs: number, nowMs: number): CountdownParts {
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, complete: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, complete: false };
}

export function isFutureEventStart(eventStartsAt: string | null | undefined): boolean {
  if (!eventStartsAt) return false;
  const ms = Date.parse(eventStartsAt);
  return Number.isFinite(ms) && ms > Date.now();
}
