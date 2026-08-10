import { Logger } from '@nestjs/common';
import { StripeWebhookProcessingStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { StripeWebhookDispatchService } from './stripe-webhook-dispatch.service';
import { StripeWebhookRetryService } from './stripe-webhook-retry.service';

describe('StripeWebhookRetryService', () => {
  let service: StripeWebhookRetryService;
  const prisma = createPrismaMock();
  const dispatch = {
    reprocessFromStripeEventId: jest.fn(),
  };
  const originalEnabled = process.env.STRIPE_WEBHOOK_RETRY_ENABLED;
  const originalInterval = process.env.STRIPE_WEBHOOK_RETRY_INTERVAL_MS;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    delete process.env.STRIPE_WEBHOOK_RETRY_ENABLED;
    delete process.env.STRIPE_WEBHOOK_RETRY_INTERVAL_MS;
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeWebhookRetryService,
        { provide: PrismaService, useValue: prisma },
        { provide: StripeWebhookDispatchService, useValue: dispatch },
      ],
    }).compile();
    service = moduleRef.get(StripeWebhookRetryService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
    if (originalEnabled === undefined) {
      delete process.env.STRIPE_WEBHOOK_RETRY_ENABLED;
    } else {
      process.env.STRIPE_WEBHOOK_RETRY_ENABLED = originalEnabled;
    }
    if (originalInterval === undefined) {
      delete process.env.STRIPE_WEBHOOK_RETRY_INTERVAL_MS;
    } else {
      process.env.STRIPE_WEBHOOK_RETRY_INTERVAL_MS = originalInterval;
    }
  });

  it('does not schedule when STRIPE_WEBHOOK_RETRY_ENABLED=false', () => {
    process.env.STRIPE_WEBHOOK_RETRY_ENABLED = 'false';
    const spy = jest.spyOn(global, 'setInterval');
    service.onModuleInit();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not schedule when interval is below 60s', () => {
    process.env.STRIPE_WEBHOOK_RETRY_INTERVAL_MS = '1000';
    const spy = jest.spyOn(global, 'setInterval');
    service.onModuleInit();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns 0 when no stale failed events', async () => {
    prisma.stripeWebhookEvent.findMany.mockResolvedValue([]);
    await expect(service.retryStaleFailed()).resolves.toBe(0);
    expect(dispatch.reprocessFromStripeEventId).not.toHaveBeenCalled();
  });

  it('counts retried events when reprocess succeeds', async () => {
    prisma.stripeWebhookEvent.findMany.mockResolvedValue([
      { eventId: 'evt_1' },
      { eventId: 'evt_2' },
    ]);
    dispatch.reprocessFromStripeEventId
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    await expect(service.retryStaleFailed()).resolves.toBe(1);
    expect(dispatch.reprocessFromStripeEventId).toHaveBeenCalledTimes(2);
  });

  it('continues when reprocess throws for one event', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    prisma.stripeWebhookEvent.findMany.mockResolvedValue([
      { eventId: 'evt_bad' },
      { eventId: 'evt_ok' },
    ]);
    dispatch.reprocessFromStripeEventId
      .mockRejectedValueOnce(new Error('stripe down'))
      .mockResolvedValueOnce(true);

    await expect(service.retryStaleFailed()).resolves.toBe(1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('findMany filters FAILED status with attempts cap', async () => {
    prisma.stripeWebhookEvent.findMany.mockResolvedValue([]);
    await service.retryStaleFailed();
    const findManyCalls = prisma.stripeWebhookEvent.findMany.mock
      .calls as unknown as Array<
      [
        {
          where: { status: string; attempts: { lt: number } };
          take: number;
        },
      ]
    >;
    const call = findManyCalls[0]?.[0];
    expect(call?.where.status).toBe(StripeWebhookProcessingStatus.FAILED);
    expect(call?.where.attempts.lt).toBe(8);
    expect(call?.take).toBe(20);
  });
});
