import { parseHHMM } from '../availability/booking-tz';

type SectionTimeInput = { startTime: string; endTime: string };

export function validateSectionsNoOverlapMessage(
  sections: SectionTimeInput[],
  dayLabel?: string,
): string | null {
  const prefix = dayLabel ? `${dayLabel}: ` : '';
  const parsed: Array<{ index: number; start: number; end: number }> = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]!;
    const start = parseHHMM(s.startTime, 'startTime');
    const end = parseHHMM(s.endTime, 'endTime');
    if (end <= start) {
      return `${prefix}Section ${i + 1}: end time must be after start time.`;
    }
    parsed.push({ index: i, start, end });
  }

  parsed.sort((a, b) => a.start - b.start || a.end - b.end);

  for (let i = 1; i < parsed.length; i++) {
    const prev = parsed[i - 1]!;
    const curr = parsed[i]!;
    if (curr.start < prev.end) {
      return `${prefix}Section ${curr.index + 1} overlaps section ${prev.index + 1}.`;
    }
  }

  return null;
}
