import { ReservationEventScheduleMode } from '@prisma/client';
import { buildPublicScheduleDisplay } from './upcoming-event-public-schedule.util';

describe('buildPublicScheduleDisplay', () => {
  it('builds FIXED_EVENT display', () => {
    const display = buildPublicScheduleDisplay({
      id: 'tpl-1',
      name: 'Gala',
      scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      timezone: 'America/New_York',
      salesStartDate: new Date('2026-07-01T00:00:00.000Z'),
      salesEndDate: new Date('2026-07-31T00:00:00.000Z'),
      eventDate: new Date('2026-08-15T00:00:00.000Z'),
      eventStartTime: '20:00',
      eventEndTime: '23:00',
      weekdays: [],
      classSections: [],
    } as never);

    expect(display.mode).toBe('FIXED_EVENT');
    expect(display.timezone).toBe('America/New_York');
    expect(display.eventDate).toBe('2026-08-15');
    expect(display.startTime).toBe('20:00');
    expect(display.salesWindow).toEqual({
      start: '2026-07-01',
      end: '2026-07-31',
    });
  });

  it('builds RECURRING_WEEKLY display with active days', () => {
    const display = buildPublicScheduleDisplay({
      id: 'tpl-2',
      name: 'Classes',
      scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
      timezone: 'America/New_York',
      recurringEffectiveFrom: new Date('2026-06-01T00:00:00.000Z'),
      recurringStartTime: '18:00',
      recurringEndTime: '19:00',
      weekdays: [
        { weekday: 1, isActive: true },
        { weekday: 3, isActive: false },
        { weekday: 5, isActive: true },
      ],
      classSections: [
        {
          id: 'sec-1',
          weekday: 1,
          isActive: true,
          label: 'Beginner',
          startTime: '18:00',
          endTime: '19:00',
          sortOrder: 1,
        },
      ],
    } as never);

    expect(display.mode).toBe('RECURRING_WEEKLY');
    expect(display.weekdayLabels).toEqual(['Mon', 'Fri']);
    expect(JSON.stringify(display)).toContain('Beginner');
    expect(JSON.stringify(display)).toContain('"weekday":1');
  });
});
