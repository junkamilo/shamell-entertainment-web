/**
 * Integration: Admin stripe webhook events against a real database.
 * Run: ADMIN_STRIPE_WEBHOOKS_INTEGRATION=1 npm test -- admin-stripe-webhooks.integration
 */
import { PrismaClient, StripeWebhookProcessingStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AdminStripeWebhooksRepository } from './services/admin-stripe-webhooks.repository';
import { AdminStripeWebhooksService } from './services/admin-stripe-webhooks.service';

const run = process.env.ADMIN_STRIPE_WEBHOOKS_INTEGRATION === '1';

(run ? describe : describe.skip)(
  'AdminStripeWebhooks module integration',
  () => {
    jest.setTimeout(60_000);

    let prisma: PrismaClient;
    let pool: Pool;
    let service: AdminStripeWebhooksService;
    let createdId: string | null = null;
    let createdEventId: string | null = null;

    beforeAll(async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('dotenv/config');
      const url = process.env.DATABASE_URL?.trim();
      if (!url) {
        throw new Error(
          'DATABASE_URL required for ADMIN_STRIPE_WEBHOOKS_INTEGRATION',
        );
      }
      pool = new Pool({ connectionString: url, max: 2 });
      prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
      await prisma.$connect();

      const repository = new AdminStripeWebhooksRepository(prisma as never);
      service = new AdminStripeWebhooksService(repository);
    });

    afterAll(async () => {
      if (createdId) {
        await prisma.stripeWebhookEvent
          .delete({ where: { id: createdId } })
          .catch(() => null);
      }
      await prisma.$disconnect();
      await pool.end();
    });

    it('listEvents sees a seeded PROCESSED webhook event', async () => {
      const suffix = Date.now();
      createdEventId = `evt_integration_${suffix}`;
      const created = await prisma.stripeWebhookEvent.create({
        data: {
          eventId: createdEventId,
          eventType: `integration.test.${suffix}`,
          livemode: false,
          status: StripeWebhookProcessingStatus.PROCESSED,
          metadataFlow: 'integration',
          checkoutSessionId: null,
          handler: 'integration',
          payloadSummary: { source: 'integration' },
          processedAt: new Date(),
          attempts: 1,
        },
      });
      createdId = created.id;

      const listed = await service.listEvents({
        page: 1,
        limit: 50,
        eventType: `integration.test.${suffix}`,
      });
      expect(listed.items.some((row) => row.eventId === createdEventId)).toBe(
        true,
      );
    });
  },
);
