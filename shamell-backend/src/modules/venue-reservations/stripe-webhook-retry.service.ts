import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { StripeWebhookProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeWebhookDispatchService } from './stripe-webhook-dispatch.service';

const DEFAULT_RETRY_INTERVAL_MS = 60 * 60 * 1000;
const FAILED_AGE_MS = 60 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 8;
const RETRY_BATCH_SIZE = 20;

@Injectable()
export class StripeWebhookRetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StripeWebhookRetryService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatch: StripeWebhookDispatchService,
  ) {}

  onModuleInit() {
    if (process.env.STRIPE_WEBHOOK_RETRY_ENABLED === 'false') {
      return;
    }
    const intervalMs = Number(
      process.env.STRIPE_WEBHOOK_RETRY_INTERVAL_MS ?? DEFAULT_RETRY_INTERVAL_MS,
    );
    if (!Number.isFinite(intervalMs) || intervalMs < 60_000) {
      return;
    }
    this.timer = setInterval(() => {
      void this.retryStaleFailed();
    }, intervalMs);
    this.logger.log(
      `stripe-webhook-retry-scheduled intervalMs=${intervalMs}`,
    );
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async retryStaleFailed(): Promise<number> {
    const cutoff = new Date(Date.now() - FAILED_AGE_MS);
    const failed = await this.prisma.stripeWebhookEvent.findMany({
      where: {
        status: StripeWebhookProcessingStatus.FAILED,
        updatedAt: { lt: cutoff },
        attempts: { lt: MAX_RETRY_ATTEMPTS },
      },
      take: RETRY_BATCH_SIZE,
      orderBy: { updatedAt: 'asc' },
      select: { eventId: true },
    });

    if (failed.length === 0) {
      return 0;
    }

    this.logger.warn(
      `stripe-webhook-retry-batch count=${failed.length} cutoff=${cutoff.toISOString()}`,
    );

    let retried = 0;
    for (const row of failed) {
      try {
        const didRetry = await this.dispatch.reprocessFromStripeEventId(
          row.eventId,
        );
        if (didRetry) retried += 1;
      } catch (err) {
        this.logger.warn(
          `stripe-webhook-retry-failed eventId=${row.eventId} reason=${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (retried > 0) {
      this.logger.log(`stripe-webhook-retry-complete retried=${retried}`);
    }
    return retried;
  }
}
