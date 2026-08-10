import { StripeWebhookProcessingStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing/prisma-mock';
import { makeStripeWebhookEventLite } from '../__mocks__/stripe.fixtures';
import { StripeWebhookAuditService } from './stripe-webhook-audit.service';

describe('StripeWebhookAuditService', () => {
  let service: StripeWebhookAuditService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeWebhookAuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(StripeWebhookAuditService);
  });

  it('isProcessed is true when processedAt is set', async () => {
    prisma.stripeWebhookEvent.findUnique.mockResolvedValue({
      processedAt: new Date(),
      status: StripeWebhookProcessingStatus.RECEIVED,
    });
    await expect(service.isProcessed('evt_1')).resolves.toBe(true);
  });

  it('isProcessed is true when status is PROCESSED', async () => {
    prisma.stripeWebhookEvent.findUnique.mockResolvedValue({
      processedAt: null,
      status: StripeWebhookProcessingStatus.PROCESSED,
    });
    await expect(service.isProcessed('evt_1')).resolves.toBe(true);
  });

  it('isProcessed is false when not found', async () => {
    prisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
    await expect(service.isProcessed('evt_missing')).resolves.toBe(false);
  });

  it('markProcessed updates row with PROCESSED status', async () => {
    prisma.stripeWebhookEvent.update.mockResolvedValue({});
    await service.markProcessed('evt_1');
    const updateCalls = prisma.stripeWebhookEvent.update.mock.calls as Array<
      [
        {
          where: { eventId: string };
          data: { status: StripeWebhookProcessingStatus; lastError: null };
        },
      ]
    >;
    expect(updateCalls[0][0].where.eventId).toBe('evt_1');
    expect(updateCalls[0][0].data.status).toBe(
      StripeWebhookProcessingStatus.PROCESSED,
    );
    expect(updateCalls[0][0].data.lastError).toBeNull();
  });

  it('markFailed stores truncated error', async () => {
    prisma.stripeWebhookEvent.update.mockResolvedValue({});
    await service.markFailed('evt_1', new Error('boom'));
    expect(prisma.stripeWebhookEvent.update).toHaveBeenCalledWith({
      where: { eventId: 'evt_1' },
      data: {
        lastError: 'boom',
        status: StripeWebhookProcessingStatus.FAILED,
      },
    });
  });

  it('trackAttempt upserts RECEIVED row', async () => {
    prisma.stripeWebhookEvent.upsert.mockResolvedValue({});
    const event = makeStripeWebhookEventLite({ id: 'evt_track' });
    await service.trackAttempt(event, {
      metadataFlow: 'booking_quote',
      checkoutSessionId: 'cs_1',
      handler: 'bookings',
    });
    const upsertCalls = prisma.stripeWebhookEvent.upsert.mock.calls as Array<
      [
        {
          where: { eventId: string };
          create: {
            eventId: string;
            status: StripeWebhookProcessingStatus;
            attempts: number;
            metadataFlow: string;
          };
        },
      ]
    >;
    expect(upsertCalls[0][0].where.eventId).toBe('evt_track');
    expect(upsertCalls[0][0].create.eventId).toBe('evt_track');
    expect(upsertCalls[0][0].create.status).toBe(
      StripeWebhookProcessingStatus.RECEIVED,
    );
    expect(upsertCalls[0][0].create.attempts).toBe(1);
    expect(upsertCalls[0][0].create.metadataFlow).toBe('booking_quote');
  });

  it('isProcessed is false when row exists but not processed', async () => {
    prisma.stripeWebhookEvent.findUnique.mockResolvedValue({
      processedAt: null,
      status: StripeWebhookProcessingStatus.RECEIVED,
    });
    await expect(service.isProcessed('evt_open')).resolves.toBe(false);
  });

  it('trackAttempt defaults empty ctx and JsonNull payload', async () => {
    prisma.stripeWebhookEvent.upsert.mockResolvedValue({});
    const event = makeStripeWebhookEventLite({ id: 'evt_default' });
    await service.trackAttempt(event);
    expect(prisma.stripeWebhookEvent.upsert).toHaveBeenCalled();
    const upsertCalls = prisma.stripeWebhookEvent.upsert.mock.calls as Array<
      [{ create: { metadataFlow: null; handler: null } }]
    >;
    expect(upsertCalls[0][0].create.metadataFlow).toBeNull();
    expect(upsertCalls[0][0].create.handler).toBeNull();
  });

  it('trackAttempt updates metadata fields when provided on retry', async () => {
    prisma.stripeWebhookEvent.upsert.mockResolvedValue({});
    const event = makeStripeWebhookEventLite({ id: 'evt_retry' });
    await service.trackAttempt(event, {
      metadataFlow: 'venue_seat',
      checkoutSessionId: 'cs_2',
      handler: 'venue',
      payloadSummary: { kind: 'test' },
    });
    const upsertCalls = prisma.stripeWebhookEvent.upsert.mock.calls as Array<
      [
        {
          update: {
            metadataFlow?: string;
            checkoutSessionId?: string;
            handler?: string;
          };
        },
      ]
    >;
    expect(upsertCalls[0][0].update.metadataFlow).toBe('venue_seat');
    expect(upsertCalls[0][0].update.checkoutSessionId).toBe('cs_2');
    expect(upsertCalls[0][0].update.handler).toBe('venue');
  });

  it('markProcessing sets PROCESSING status and handler', async () => {
    prisma.stripeWebhookEvent.update.mockResolvedValue({});
    await service.markProcessing('evt_1', 'upcoming-events');
    expect(prisma.stripeWebhookEvent.update).toHaveBeenCalledWith({
      where: { eventId: 'evt_1' },
      data: {
        status: StripeWebhookProcessingStatus.PROCESSING,
        handler: 'upcoming-events',
      },
    });
  });

  it('markFailed stringifies non-Error values', async () => {
    prisma.stripeWebhookEvent.update.mockResolvedValue({});
    await service.markFailed('evt_1', 'plain-string-error');
    expect(prisma.stripeWebhookEvent.update).toHaveBeenCalledWith({
      where: { eventId: 'evt_1' },
      data: {
        lastError: 'plain-string-error',
        status: StripeWebhookProcessingStatus.FAILED,
      },
    });
  });

  it('markFailed logs when update throws', async () => {
    prisma.stripeWebhookEvent.update.mockRejectedValue(new Error('db down'));
    await expect(
      service.markFailed('evt_1', new Error('handler boom')),
    ).resolves.toBeUndefined();
  });
});
