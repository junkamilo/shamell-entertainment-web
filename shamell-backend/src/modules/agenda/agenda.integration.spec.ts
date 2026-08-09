/**
 * Integration: Agenda catalog against a real database.
 * Run: AGENDA_INTEGRATION=1 npm test -- agenda.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AdminPaymentsService } from '../admin-payments/services/admin-payments.service';
import { ContactInboxService } from '../contact/services/contact-inbox.service';
import { AgendaRepository } from './services/agenda.repository';
import { AgendaService } from './services/agenda.service';

const run = process.env.AGENDA_INTEGRATION === '1';

(run ? describe : describe.skip)('Agenda module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: AgendaService;
  let createdOccasionId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for AGENDA_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new AgendaRepository(prisma as never);
    const contactInbox = {
      countPeticionesBadge: jest.fn().mockResolvedValue({ count: 0 }),
    } as unknown as ContactInboxService;
    const adminPayments = {
      countBadgeSince: jest.fn().mockResolvedValue({ count: 0 }),
    } as unknown as AdminPaymentsService;
    service = new AgendaService(repository, contactInbox, adminPayments);
  });

  afterAll(async () => {
    if (createdOccasionId) {
      await prisma.occasionType
        .delete({ where: { id: createdOccasionId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('getAgendarCatalog returns array-shaped catalog', async () => {
    const suffix = Date.now();
    const occasion = await prisma.occasionType.create({
      data: {
        name: `Integration Occasion ${suffix}`,
        isActive: true,
      },
    });
    createdOccasionId = occasion.id;

    const catalog = await service.getAgendarCatalog();
    expect(Array.isArray(catalog.services)).toBe(true);
    expect(Array.isArray(catalog.eventTypes)).toBe(true);
    expect(Array.isArray(catalog.occasions)).toBe(true);
    expect(catalog.occasions.some((row) => row.id === occasion.id)).toBe(true);
  });
});
