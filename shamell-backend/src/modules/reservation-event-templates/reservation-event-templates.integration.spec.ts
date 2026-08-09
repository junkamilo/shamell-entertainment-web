/**
 * Integration: reservation event templates against a real database.
 * Run: RESERVATION_EVENT_TEMPLATES_INTEGRATION=1 npm test -- reservation-event-templates.integration
 */
import { PrismaClient, ReservationEventScheduleMode } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ReservationEventTemplatesRepository } from './services/reservation-event-templates.repository';
import { ReservationEventTemplatesService } from './services/reservation-event-templates.service';

const run = process.env.RESERVATION_EVENT_TEMPLATES_INTEGRATION === '1';

(run ? describe : describe.skip)(
  'ReservationEventTemplates module integration',
  () => {
    jest.setTimeout(60_000);

    let prisma: PrismaClient;
    let pool: Pool;
    let service: ReservationEventTemplatesService;
    let createdId: string | null = null;

    beforeAll(async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('dotenv/config');
      const url = process.env.DATABASE_URL?.trim();
      if (!url) {
        throw new Error(
          'DATABASE_URL required for RESERVATION_EVENT_TEMPLATES_INTEGRATION',
        );
      }
      pool = new Pool({ connectionString: url, max: 2 });
      prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
      await prisma.$connect();

      const repository = new ReservationEventTemplatesRepository(
        prisma as never,
      );
      service = new ReservationEventTemplatesService(repository);
    });

    afterAll(async () => {
      if (createdId) {
        await prisma.reservationEventTemplate
          .delete({ where: { id: createdId } })
          .catch(() => null);
      }
      await prisma.$disconnect();
      await pool.end();
    });

    it('creates, lists, and deletes an unlinked fixed template', async () => {
      const suffix = Date.now();
      const futureYear = new Date().getUTCFullYear() + 1;
      const created = await service.createAdmin({
        name: `Integration Template ${suffix}`,
        timezone: 'America/New_York',
        scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
        salesStartDate: `${futureYear}-03-01`,
        salesEndDate: `${futureYear}-03-15`,
        eventDate: `${futureYear}-03-20`,
        eventStartTime: '19:00',
        eventEndTime: '22:00',
      });
      createdId = created.id;

      expect(created.name).toContain('Integration Template');
      expect(created.scheduleMode).toBe(
        ReservationEventScheduleMode.FIXED_EVENT,
      );

      const listed = await service.listAdmin(
        ReservationEventScheduleMode.FIXED_EVENT,
      );
      expect(listed.some((row) => row.id === created.id)).toBe(true);

      const byId = await service.getAdminById(created.id);
      expect(byId.id).toBe(created.id);

      const deleted = await service.deleteAdmin(created.id);
      expect(deleted.message).toContain('deleted');
      createdId = null;
    });
  },
);
