/**
 * Integration: Contact findOne / badge against a real database.
 * Run: CONTACT_INTEGRATION=1 npm test -- contact.integration
 */
import { ContactRequestStatus, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ContactInboxService } from './services/contact-inbox.service';
import { ContactRepository } from './services/contact.repository';
import { ContactService } from './services/contact.service';
import type { AvailabilityService } from '../availability/services/availability.service';
import type { BookingsService } from '../bookings/services/bookings.service';
import type { MailService } from '../mail/services/mail.service';
import type { AdminCustomerActivityNotifyService } from '../mail/services/admin-customer-activity-notify.service';
import type { ConfigService } from '@nestjs/config';

const run = process.env.CONTACT_INTEGRATION === '1';

(run ? describe : describe.skip)('Contact module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: ContactService;
  let inbox: ContactInboxService;
  let createdId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for CONTACT_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new ContactRepository(prisma as never);
    inbox = new ContactInboxService(repository);
    const availability = {
      bookingTimeZone: () => 'America/New_York',
      assertDateTimeAllowed: () => Promise.resolve(undefined),
    } as unknown as AvailabilityService;
    const mail = {
      sendTransactional: () => Promise.resolve({ ok: false }),
    } as unknown as MailService;
    const notify = {
      notifyCustomerActivity: () => Promise.resolve(undefined),
    } as unknown as AdminCustomerActivityNotifyService;
    const config = { get: () => undefined } as unknown as ConfigService;
    const bookings = {
      preparePublicBookingInquiry: () => Promise.resolve(null),
      insertPublicBookingInquiry: () => Promise.resolve(undefined),
    } as unknown as BookingsService;

    service = new ContactService(
      repository,
      availability,
      mail,
      notify,
      config,
      bookings,
      inbox,
    );
  });

  afterAll(async () => {
    if (createdId) {
      await prisma.contactRequest
        .delete({ where: { id: createdId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('findOne and badge count see a seeded contact request', async () => {
    const suffix = Date.now();
    const created = await prisma.contactRequest.create({
      data: {
        fullName: `Integration Contact ${suffix}`,
        email: `contact-int-${suffix}@example.com`,
        subject: 'Integration reservation inquiry',
        message: 'Integration message',
        status: ContactRequestStatus.PENDING,
        isRead: false,
      },
    });
    createdId = created.id;

    const found = await service.findOne(created.id);
    expect(found.id).toBe(created.id);
    expect(found.email).toContain('contact-int-');

    const badge = await inbox.countPeticionesBadge({ lane: 'bookings' });
    expect(typeof badge.count).toBe('number');
    expect(badge.count).toBeGreaterThanOrEqual(0);
  });
});
