import { BadRequestException } from '@nestjs/common';
import { parseHHMM } from './booking-tz';
import type { UpsertWeeklySlotsDto } from '../dto/upsert-weekly-slots.dto';

export function validateWeeklyPayload(dto: UpsertWeeklySlotsDto): void {
  const days = dto.slots.map((s) => s.weekday);
  const uniq = new Set(days);
  if (uniq.size !== 7) {
    throw new BadRequestException(
      'slots must include each weekday 0–6 exactly once.',
    );
  }
  for (const s of dto.slots) {
    if (!s.isClosed) {
      if (!s.startTime || !s.endTime) {
        throw new BadRequestException(
          `Weekday ${s.weekday}: startTime and endTime required when open.`,
        );
      }
      const a = parseHHMM(s.startTime, 'startTime');
      const b = parseHHMM(s.endTime, 'endTime');
      if (b <= a) {
        throw new BadRequestException(
          `Weekday ${s.weekday}: endTime must be after startTime.`,
        );
      }
    }
  }
}
