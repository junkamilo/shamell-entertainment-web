import {
  assertValidMonthIso,
  currentCalendarMonthIso,
  listPurchasableMonths,
  sessionCalendarMonthIso,
} from './class-month-package.util';

describe('class-month-package.util', () => {
  it('formats session month in timezone', () => {
    const startsAt = new Date('2026-06-15T18:00:00.000Z');
    expect(sessionCalendarMonthIso(startsAt, 'America/New_York')).toMatch(
      /^2026-0[56]$/,
    );
  });

  it('lists unique future months', () => {
    const now = new Date('2026-05-01T12:00:00.000Z');
    const months = listPurchasableMonths(
      [
        {
          startsAt: new Date('2026-05-10T15:00:00.000Z'),
          endsAt: new Date('2026-05-10T16:00:00.000Z'),
          timezone: 'America/New_York',
        },
        {
          startsAt: new Date('2026-06-10T15:00:00.000Z'),
          endsAt: new Date('2026-06-10T16:00:00.000Z'),
          timezone: 'America/New_York',
        },
        {
          startsAt: new Date('2026-04-10T15:00:00.000Z'),
          endsAt: new Date('2026-04-10T16:00:00.000Z'),
          timezone: 'America/New_York',
        },
      ],
      now,
    );
    expect(months.length).toBeGreaterThanOrEqual(1);
    expect(months).toContain('2026-06');
    expect(months).not.toContain('2026-04');
  });

  it('rejects invalid monthIso', () => {
    expect(() => assertValidMonthIso('06-2026')).toThrow();
    expect(() => assertValidMonthIso('2026-13')).toThrow();
    expect(() => assertValidMonthIso('2026-06')).not.toThrow();
  });

  it('gets current calendar month in timezone', () => {
    const now = new Date('2026-06-01T01:00:00.000Z');
    expect(currentCalendarMonthIso('America/New_York', now)).toBe('2026-05');
    expect(currentCalendarMonthIso('UTC', now)).toBe('2026-06');
  });
});
