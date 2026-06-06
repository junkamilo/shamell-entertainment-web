import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

const MONTH_ISO_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function assertValidMonthIso(monthIso: string): void {
  if (!MONTH_ISO_RE.test(monthIso)) {
    throw new BadRequestException('monthIso must be YYYY-MM.');
  }
}

export function sessionCalendarMonthIso(
  startsAt: Date,
  timezone: string,
): string {
  const dateIso = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(startsAt);
  return dateIso.slice(0, 7);
}

export function currentCalendarMonthIso(
  timezone: string,
  now = new Date(),
): string {
  return sessionCalendarMonthIso(now, timezone);
}

type SessionLike = {
  startsAt: Date;
  endsAt: Date;
  timezone: string;
};

export function listPurchasableMonths(
  sessions: SessionLike[],
  now = new Date(),
): string[] {
  const months = new Set<string>();
  for (const session of sessions) {
    if (session.endsAt <= now) continue;
    months.add(sessionCalendarMonthIso(session.startsAt, session.timezone));
  }
  return [...months].sort();
}

export async function resolveMonthSessions(
  prisma: PrismaService,
  eventId: string,
  monthIso: string,
  timezone: string,
  now = new Date(),
): Promise<
  Prisma.UpcomingClassSessionGetPayload<{ include: { section: true } }>[]
> {
  assertValidMonthIso(monthIso);

  const rows = await prisma.upcomingClassSession.findMany({
    where: {
      eventId,
      isActive: true,
      endsAt: { gt: now },
    },
    include: { section: true },
    orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
  });

  return rows.filter(
    (row) =>
      sessionCalendarMonthIso(row.startsAt, row.timezone || timezone) ===
      monthIso,
  );
}

export async function assertMonthSessionsAvailable(
  sessions: Array<{
    id: string;
    startsAt: Date;
    timezone: string;
    capacity: number;
  }>,
  seatsRemainingFn: (sessionId: string, capacity: number) => Promise<number>,
): Promise<void> {
  if (sessions.length === 0) {
    throw new NotFoundException('No class sessions available for this month.');
  }

  for (const session of sessions) {
    const remaining = await seatsRemainingFn(session.id, session.capacity);
    if (remaining <= 0) {
      const label = session.startsAt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: session.timezone,
      });
      throw new ConflictException(`Session on ${label} is full.`);
    }
  }
}
