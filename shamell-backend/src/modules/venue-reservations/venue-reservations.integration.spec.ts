/**
 * Integration: venue seat availability against a real database.
 * Run: VENUE_RESERVATIONS_INTEGRATION=1 npm test -- venue-reservations.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { VenueReservationsRepository } from './services/venue-reservations.repository';
import { VenueReservationsService } from './services/venue-reservations.service';

const run = process.env.VENUE_RESERVATIONS_INTEGRATION === '1';

(run ? describe : describe.skip)('VenueReservations module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: VenueReservationsService;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error(
        'DATABASE_URL required for VENUE_RESERVATIONS_INTEGRATION',
      );
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new VenueReservationsRepository(prisma as never);
    service = new VenueReservationsService(
      repository,
      { get: () => undefined } as unknown as ConfigService,
      { sendTransactional: jest.fn() } as never,
      { notifyPaymentOutcome: jest.fn() } as never,
      {
        client: {},
        webhookSecret: 'whsec_test',
      } as never,
      {
        getPublicFloorLayoutForClient: jest
          .fn()
          .mockResolvedValue({ items: [] }),
      } as never,
    );
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
  });

  it('getAvailability returns a shaped payload', async () => {
    const result = await service.getAvailability();
    expect(Array.isArray(result.reservedLayoutItemIds)).toBe(true);
    expect(typeof result.reservationsOpen).toBe('boolean');
  });
});
