import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  assertMonthSessionsAvailable,
  assertValidMonthIso,
  currentCalendarMonthIso,
  listPurchasableMonths,
  resolveMonthSessions,
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

  it('resolveMonthSessions filters rows to the requested month', async () => {
    const now = new Date('2026-08-01T12:00:00.000Z');
    const prisma = {
      upcomingClassSession: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 's-aug',
            startsAt: new Date('2026-08-15T18:00:00.000Z'),
            timezone: 'America/New_York',
            section: null,
          },
          {
            id: 's-sep',
            startsAt: new Date('2026-09-15T18:00:00.000Z'),
            timezone: 'America/New_York',
            section: null,
          },
        ]),
      },
    };

    const rows = await resolveMonthSessions(
      prisma as never,
      'event-1',
      '2026-08',
      'America/New_York',
      now,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('s-aug');
    expect(prisma.upcomingClassSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eventId: 'event-1',
          isActive: true,
        }) as Record<string, unknown>,
      }),
    );
  });

  it('assertMonthSessionsAvailable throws NotFound when empty', async () => {
    await expect(
      assertMonthSessionsAvailable([], () => Promise.resolve(5)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('assertMonthSessionsAvailable throws Conflict when a session is full', async () => {
    await expect(
      assertMonthSessionsAvailable(
        [
          {
            id: 's1',
            startsAt: new Date('2026-08-15T18:00:00.000Z'),
            timezone: 'America/New_York',
            capacity: 10,
          },
        ],
        () => Promise.resolve(0),
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    try {
      await assertMonthSessionsAvailable(
        [
          {
            id: 's1',
            startsAt: new Date('2026-08-15T18:00:00.000Z'),
            timezone: 'America/New_York',
            capacity: 10,
          },
        ],
        () => Promise.resolve(0),
      );
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      expect(String((err as ConflictException).message)).toMatch(
        /Session on .+ is full\./,
      );
    }
  });

  it('assertMonthSessionsAvailable resolves when all sessions have seats', async () => {
    const seatsRemainingFn = jest.fn().mockResolvedValue(3);
    await expect(
      assertMonthSessionsAvailable(
        [
          {
            id: 's1',
            startsAt: new Date('2026-08-15T18:00:00.000Z'),
            timezone: 'America/New_York',
            capacity: 10,
          },
          {
            id: 's2',
            startsAt: new Date('2026-08-22T18:00:00.000Z'),
            timezone: 'America/New_York',
            capacity: 8,
          },
        ],
        seatsRemainingFn,
      ),
    ).resolves.toBeUndefined();
    expect(seatsRemainingFn).toHaveBeenCalledTimes(2);
  });
});
