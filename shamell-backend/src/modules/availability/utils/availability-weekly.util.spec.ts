import { BadRequestException } from '@nestjs/common';
import { makeWeeklySlotsDto } from '../__mocks__/availability.fixtures';
import { validateWeeklyPayload } from './availability-weekly.util';

describe('availability-weekly.util', () => {
  it('accepts exactly 7 unique weekdays', () => {
    expect(() => validateWeeklyPayload(makeWeeklySlotsDto())).not.toThrow();
  });

  it('rejects duplicate weekdays', () => {
    const dto = makeWeeklySlotsDto({
      slots: Array.from({ length: 7 }, () => ({
        weekday: 1,
        isClosed: true,
      })),
    });
    expect(() => validateWeeklyPayload(dto)).toThrow(BadRequestException);
  });

  it('requires start before end when open', () => {
    const dto = makeWeeklySlotsDto();
    dto.slots[0] = {
      weekday: 0,
      isClosed: false,
      startTime: '18:00',
      endTime: '09:00',
    };
    expect(() => validateWeeklyPayload(dto)).toThrow(BadRequestException);
  });
});
