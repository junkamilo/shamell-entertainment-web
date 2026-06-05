import { BadRequestException } from '@nestjs/common';
import {
  Prisma,
  type PrismaClient,
  ReservationEventScheduleMode,
} from '@prisma/client';
import { parseHHMM, utcInstantForWallClock } from '../availability/booking-tz';
import { todayISODateInTimezone } from '../reservation-event-templates/reservation-event-template.util';
import { withTemplateRegenerationLock } from './class-session-regeneration.lock';

type DbClient = PrismaClient | Prisma.TransactionClient;

const GENERATION_WEEKS = 12;
const REGENERATE_TX_TIMEOUT_MS = 120_000;

function addDaysIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayFromIso(dateIso: string, timeZone: string): number {
  const d = new Date(`${dateIso}T12:00:00.000Z`);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  });
  const short = fmt.format(d);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[short] ?? d.getUTCDay();
}

type SectionRow = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  sortOrder: number;
  defaultCapacity: number;
  defaultPrice: Prisma.Decimal | null;
};

async function loadActiveClassSections(
  prisma: DbClient,
  templateId: string,
  activeWeekdays: Set<number>,
): Promise<SectionRow[]> {
  if (activeWeekdays.size === 0) return [];
  return prisma.reservationEventClassSection.findMany({
    where: {
      templateId,
      isActive: true,
      weekday: { in: [...activeWeekdays] },
    },
    orderBy: [{ weekday: 'asc' }, { sortOrder: 'asc' }],
  });
}

async function resolveLiveSection(
  prisma: DbClient,
  templateId: string,
  weekday: number,
  sortOrder: number,
): Promise<SectionRow | null> {
  return prisma.reservationEventClassSection.findFirst({
    where: { templateId, weekday, sortOrder, isActive: true },
    select: {
      id: true,
      weekday: true,
      startTime: true,
      endTime: true,
      sortOrder: true,
      defaultCapacity: true,
      defaultPrice: true,
    },
  });
}

/** Create or update a generated session; matches legacy rows with null sectionId. */
async function upsertGeneratedClassSession(
  prisma: DbClient,
  data: {
    eventId: string;
    sectionId: string;
    weekday: number;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    capacity: number;
    price: number;
    sortOrder: number;
  },
): Promise<void> {
  const existing = await prisma.upcomingClassSession.findFirst({
    where: {
      eventId: data.eventId,
      startsAt: data.startsAt,
      OR: [
        { sectionId: data.sectionId },
        { sectionId: null, weekday: data.weekday },
      ],
    },
    select: { id: true },
  });

  const sessionFields = {
    sectionId: data.sectionId,
    weekday: data.weekday,
    endsAt: data.endsAt,
    timezone: data.timezone,
    capacity: data.capacity,
    price: data.price,
    isActive: true,
    sortOrder: data.sortOrder,
  };

  if (existing) {
    await prisma.upcomingClassSession.update({
      where: { id: existing.id },
      data: sessionFields,
    });
    return;
  }

  await prisma.upcomingClassSession.create({
    data: {
      eventId: data.eventId,
      startsAt: data.startsAt,
      currency: 'usd',
      ...sessionFields,
    },
  });
}

export type RegenerateClassSessionsResult = {
  upserted: number;
  deactivated: number;
};

async function regenerateClassSessionsInClient(
  prisma: DbClient,
  eventId: string,
): Promise<RegenerateClassSessionsResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, price: true },
  });
  if (!event) return { upserted: 0, deactivated: 0 };

  const config = await prisma.upcomingVenueConfig.findUnique({
    where: { eventId },
    include: {
      reservationEventTemplate: {
        include: {
          weekdays: { orderBy: { weekday: 'asc' } },
        },
      },
    },
  });

  const template = config?.reservationEventTemplate;
  if (
    !template ||
    template.scheduleMode !== ReservationEventScheduleMode.RECURRING_WEEKLY
  ) {
    return { upserted: 0, deactivated: 0 };
  }

  const activeWeekdays = new Set(
    template.weekdays.filter((w) => w.isActive).map((w) => w.weekday),
  );

  const sections = await loadActiveClassSections(
    prisma,
    template.id,
    activeWeekdays,
  );
  if (sections.length === 0) {
    throw new BadRequestException(
      'No class sections are configured for this recurring schedule. Save section times on the schedule template first.',
    );
  }

  const tz = template.timezone || 'America/New_York';
  const todayIso = todayISODateInTimezone(tz);
  const effectiveIso =
    template.recurringEffectiveFrom?.toISOString().slice(0, 10) ?? todayIso;
  const startIso = effectiveIso > todayIso ? effectiveIso : todayIso;
  const endIso = addDaysIso(startIso, GENERATION_WEEKS * 7);

  const basePrice = event.price != null ? Number(event.price) : 0;
  const generatedKeys = new Set<string>();
  let upserted = 0;

  for (
    let cursor = startIso;
    cursor <= endIso;
    cursor = addDaysIso(cursor, 1)
  ) {
    const wd = weekdayFromIso(cursor, tz);
    if (!activeWeekdays.has(wd)) continue;

    for (const section of sections.filter((s) => s.weekday === wd)) {
      const live = await resolveLiveSection(
        prisma,
        template.id,
        section.weekday,
        section.sortOrder,
      );
      if (!live) continue;

      const startMins = parseHHMM(live.startTime, 'startTime');
      const endMins = parseHHMM(live.endTime, 'endTime');

      const startsAt = utcInstantForWallClock(cursor, startMins, tz);
      const endsAt = utcInstantForWallClock(cursor, endMins, tz);
      if (endsAt <= startsAt) continue;

      const price =
        live.defaultPrice != null ? Number(live.defaultPrice) : basePrice;

      const key = `${live.id}:${startsAt.toISOString()}`;
      generatedKeys.add(key);

      await upsertGeneratedClassSession(prisma, {
        eventId,
        sectionId: live.id,
        weekday: wd,
        startsAt,
        endsAt,
        timezone: tz,
        capacity: live.defaultCapacity,
        price,
        sortOrder: live.sortOrder,
      });
      upserted += 1;
    }
  }

  const now = new Date();
  const futureSessions = await prisma.upcomingClassSession.findMany({
    where: {
      eventId,
      sectionId: { not: null },
      startsAt: { gt: now },
      isActive: true,
    },
    select: { id: true, sectionId: true, startsAt: true },
  });

  let deactivated = 0;
  for (const row of futureSessions) {
    const key = `${row.sectionId}:${row.startsAt.toISOString()}`;
    if (generatedKeys.has(key)) continue;

    const paidCount = await prisma.upcomingClassEnrollment.count({
      where: { sessionId: row.id, status: 'PAID' },
    });
    if (paidCount > 0) continue;

    await prisma.upcomingClassSession.updateMany({
      where: { id: row.id },
      data: { isActive: false },
    });
    deactivated += 1;
  }

  return { upserted, deactivated };
}

export async function regenerateClassSessionsForEvent(
  prisma: PrismaClient,
  eventId: string,
): Promise<RegenerateClassSessionsResult> {
  const config = await prisma.upcomingVenueConfig.findUnique({
    where: { eventId },
    select: { reservationEventTemplateId: true },
  });
  const templateId = config?.reservationEventTemplateId;
  if (!templateId) {
    return { upserted: 0, deactivated: 0 };
  }

  return withTemplateRegenerationLock(templateId, async () => {
    try {
      return await prisma.$transaction(
        (tx) => regenerateClassSessionsInClient(tx, eventId),
        { timeout: REGENERATE_TX_TIMEOUT_MS },
      );
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        await new Promise((r) => setTimeout(r, 150));
        return prisma.$transaction(
          (tx) => regenerateClassSessionsInClient(tx, eventId),
          { timeout: REGENERATE_TX_TIMEOUT_MS },
        );
      }
      throw err;
    }
  });
}
