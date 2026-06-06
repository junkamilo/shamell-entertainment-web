/**
 * Integration: recurring template + venue link + session regenerate.
 * Run: CLASS_SESSION_INTEGRATION=1 npm test -- class-session-fk.integration
 */
import { ReservationEventScheduleMode, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { regenerateClassSessionsForEvent } from './class-session-generator.util';

const run = process.env.CLASS_SESSION_INTEGRATION === '1';

(run ? describe : describe.skip)('class session FK integration', () => {
  jest.setTimeout(120_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let eventId: string;
  let templateId: string;
  let eventTypeId: string;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) throw new Error('DATABASE_URL required for integration test');
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const suffix = Date.now();
    const template = await prisma.reservationEventTemplate.create({
      data: {
        name: `integration-recurring-${suffix}`,
        timezone: 'America/New_York',
        scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
        recurringStartTime: '10:00',
        recurringEndTime: '12:00',
        recurringEffectiveFrom: new Date('2026-06-01'),
        weekdays: {
          create: [
            { weekday: 1, isActive: true },
            { weekday: 3, isActive: true },
            { weekday: 0, isActive: false },
            { weekday: 2, isActive: false },
            { weekday: 4, isActive: false },
            { weekday: 5, isActive: false },
            { weekday: 6, isActive: false },
          ],
        },
        classSections: {
          create: [
            {
              weekday: 1,
              startTime: '10:00',
              endTime: '12:00',
              sortOrder: 0,
              defaultCapacity: 20,
            },
            {
              weekday: 3,
              startTime: '10:00',
              endTime: '12:00',
              sortOrder: 0,
              defaultCapacity: 20,
            },
          ],
        },
      },
    });
    templateId = template.id;

    const eventType = await prisma.eventType.create({
      data: { name: `integration-et-${suffix}` },
    });
    eventTypeId = eventType.id;
    const event = await prisma.event.create({
      data: {
        eventTypeId: eventType.id,
        description: 'integration test event',
        items: [],
        experienceType: 'CLASSES',
      },
    });
    eventId = event.id;

    await prisma.upcomingVenueConfig.create({
      data: {
        eventId,
        reservationEventTemplateId: templateId,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.upcomingClassSession.deleteMany({ where: { eventId } });
    await prisma.upcomingVenueConfig.deleteMany({ where: { eventId } });
    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.eventType.deleteMany({ where: { id: eventTypeId } });
    await prisma.reservationEventClassSection.deleteMany({
      where: { templateId },
    });
    await prisma.reservationEventWeekday.deleteMany({ where: { templateId } });
    await prisma.reservationEventTemplate.deleteMany({
      where: { id: templateId },
    });
    await prisma.$disconnect();
    await pool.end();
  });

  it('regenerates sessions with valid sectionId FK', async () => {
    const result = await regenerateClassSessionsForEvent(prisma, eventId);
    expect(result.upserted).toBeGreaterThan(0);

    const sessions = await prisma.upcomingClassSession.findMany({
      where: { eventId, isActive: true, sectionId: { not: null } },
      take: 5,
    });
    expect(sessions.length).toBeGreaterThan(0);

    for (const row of sessions) {
      const section = await prisma.reservationEventClassSection.findUnique({
        where: { id: row.sectionId! },
      });
      expect(section).not.toBeNull();
    }
  });
});
