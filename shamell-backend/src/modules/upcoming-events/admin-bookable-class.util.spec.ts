import { ReservationEventScheduleMode } from '@prisma/client';
import {
  assessClassEventReadiness,
  countBookableUpcomingSessions,
} from './admin-bookable-class.util';

describe('assessClassEventReadiness', () => {
  const template = {
    scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
    timezone: 'America/New_York',
    activeWeekdayCount: 2,
    activeSectionCount: 1,
  };

  it('is bookable when all rules pass', () => {
    const result = assessClassEventReadiness({
      slug: 'yoga-flow',
      template,
      upcomingSessionCount: 3,
    });
    expect(result.isBookable).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('flags missing slug', () => {
    const result = assessClassEventReadiness({
      slug: null,
      template,
      upcomingSessionCount: 1,
    });
    expect(result.isBookable).toBe(false);
    expect(result.reasons).toContain('missing_slug');
  });

  it('flags non-recurring template', () => {
    const result = assessClassEventReadiness({
      slug: 'yoga-flow',
      template: {
        ...template,
        scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      },
      upcomingSessionCount: 1,
    });
    expect(result.reasons).toContain('not_recurring');
  });

  it('flags no sessions with seats', () => {
    const result = assessClassEventReadiness({
      slug: 'yoga-flow',
      template,
      upcomingSessionCount: 0,
    });
    expect(result.reasons).toContain('no_sessions');
  });
});

describe('countBookableUpcomingSessions', () => {
  it('counts only future sessions with seats', () => {
    const now = new Date('2026-06-26T12:00:00Z');
    const count = countBookableUpcomingSessions(
      [
        {
          endsAt: '2026-06-27T12:00:00Z',
          seatsRemaining: 2,
        },
        {
          endsAt: '2026-06-20T12:00:00Z',
          seatsRemaining: 5,
        },
        {
          endsAt: '2026-06-28T12:00:00Z',
          seatsRemaining: 0,
        },
      ],
      now,
    );
    expect(count).toBe(1);
  });
});
