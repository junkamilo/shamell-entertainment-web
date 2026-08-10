import { ReservationEventScheduleMode } from '@prisma/client';
import {
  assessClassEventReadiness,
  countBookableUpcomingSessions,
  templateSnapshotFromPublicSchedule,
  templateSnapshotFromVenueConfig,
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

  it('flags no_weekdays when recurring template has zero active weekdays', () => {
    const result = assessClassEventReadiness({
      slug: 'yoga-flow',
      template: { ...template, activeWeekdayCount: 0 },
      upcomingSessionCount: 2,
    });
    expect(result.isBookable).toBe(false);
    expect(result.reasons).toContain('no_weekdays');
  });

  it('flags no_sections when recurring template has zero active sections', () => {
    const result = assessClassEventReadiness({
      slug: 'yoga-flow',
      template: { ...template, activeSectionCount: 0 },
      upcomingSessionCount: 2,
    });
    expect(result.isBookable).toBe(false);
    expect(result.reasons).toContain('no_sections');
  });

  it('flags both no_weekdays and no_sections together', () => {
    const result = assessClassEventReadiness({
      slug: 'yoga-flow',
      template: {
        ...template,
        activeWeekdayCount: 0,
        activeSectionCount: 0,
      },
      upcomingSessionCount: 1,
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining(['no_weekdays', 'no_sections']),
    );
  });
});

describe('templateSnapshotFromVenueConfig', () => {
  it('returns null when config or template is missing', () => {
    expect(templateSnapshotFromVenueConfig(null)).toBeNull();
    expect(
      templateSnapshotFromVenueConfig({
        reservationTimezone: 'America/New_York',
        reservationEventTemplate: null,
      }),
    ).toBeNull();
  });

  it('counts active weekdays/sections and falls back timezone chain', () => {
    const snap = templateSnapshotFromVenueConfig({
      reservationTimezone: 'America/Chicago',
      reservationEventTemplate: {
        scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
        timezone: '  ',
        weekdays: [{ isActive: true }, { isActive: false }, { isActive: true }],
        classSections: [{ isActive: true }, { isActive: false }],
      },
    });
    expect(snap).toEqual({
      scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
      timezone: 'America/Chicago',
      activeWeekdayCount: 2,
      activeSectionCount: 1,
    });
  });

  it('defaults timezone to America/New_York when both empty', () => {
    const snap = templateSnapshotFromVenueConfig({
      reservationTimezone: null,
      reservationEventTemplate: {
        scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
        timezone: '',
        weekdays: [],
        classSections: [],
      },
    });
    expect(snap?.timezone).toBe('America/New_York');
  });
});

describe('templateSnapshotFromPublicSchedule', () => {
  it('returns null for missing or non-weekly schedule', () => {
    expect(templateSnapshotFromPublicSchedule(null)).toBeNull();
    expect(
      templateSnapshotFromPublicSchedule({
        mode: 'FIXED_EVENT',
        timezone: 'America/New_York',
        days: [],
      }),
    ).toBeNull();
  });

  it('maps RECURRING_WEEKLY days and sections with timezone fallback', () => {
    const snap = templateSnapshotFromPublicSchedule({
      mode: 'RECURRING_WEEKLY',
      timezone: '  ',
      days: [{ sections: [1, 2] }, { sections: [3] }],
    });
    expect(snap).toEqual({
      scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
      timezone: 'America/New_York',
      activeWeekdayCount: 2,
      activeSectionCount: 3,
    });
  });

  it('treats missing days as empty list', () => {
    const snap = templateSnapshotFromPublicSchedule({
      mode: 'RECURRING_WEEKLY',
      timezone: 'UTC',
    });
    expect(snap).toEqual({
      scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
      timezone: 'UTC',
      activeWeekdayCount: 0,
      activeSectionCount: 0,
    });
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
        {
          endsAt: new Date('2026-06-29T12:00:00Z'),
          seatsRemaining: 1,
        },
      ],
      now,
    );
    expect(count).toBe(2);
  });
});
