import { Injectable, Logger } from '@nestjs/common';
import { Prisma, StripeWebhookProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { StripeWebhookEventLite } from './stripe-webhook.types';

export type WebhookAuditContext = {
  metadataFlow?: string | null;
  checkoutSessionId?: string | null;
  handler?: string | null;
  payloadSummary?: Prisma.InputJsonValue;
};

@Injectable()
export class StripeWebhookAuditService {
  private readonly logger = new Logger(StripeWebhookAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isProcessed(eventId: string): Promise<boolean> {
    const row = await this.prisma.stripeWebhookEvent.findUnique({
      where: { eventId },
      select: { processedAt: true, status: true },
    });
    return (
      Boolean(row?.processedAt) ||
      row?.status === StripeWebhookProcessingStatus.PROCESSED
    );
  }

  async trackAttempt(
    event: StripeWebhookEventLite,
    ctx: WebhookAuditContext = {},
  ): Promise<void> {
    const summary = ctx.payloadSummary ?? Prisma.JsonNull;
    await this.prisma.stripeWebhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode,
        status: StripeWebhookProcessingStatus.RECEIVED,
        attempts: 1,
        metadataFlow: ctx.metadataFlow ?? null,
        checkoutSessionId: ctx.checkoutSessionId ?? null,
        handler: ctx.handler ?? null,
        payloadSummary: summary === Prisma.JsonNull ? undefined : summary,
      },
      update: {
        attempts: { increment: 1 },
        eventType: event.type,
        livemode: event.livemode,
        status: StripeWebhookProcessingStatus.RECEIVED,
        ...(ctx.metadataFlow !== undefined
          ? { metadataFlow: ctx.metadataFlow }
          : {}),
        ...(ctx.checkoutSessionId !== undefined
          ? { checkoutSessionId: ctx.checkoutSessionId }
          : {}),
        ...(ctx.handler !== undefined ? { handler: ctx.handler } : {}),
        ...(ctx.payloadSummary !== undefined
          ? {
              payloadSummary:
                summary === Prisma.JsonNull ? Prisma.JsonNull : summary,
            }
          : {}),
        lastError: null,
      },
    });
  }

  async markProcessing(eventId: string, handler: string): Promise<void> {
    await this.prisma.stripeWebhookEvent.update({
      where: { eventId },
      data: {
        status: StripeWebhookProcessingStatus.PROCESSING,
        handler,
      },
    });
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.prisma.stripeWebhookEvent.update({
      where: { eventId },
      data: {
        processedAt: new Date(),
        lastError: null,
        status: StripeWebhookProcessingStatus.PROCESSED,
      },
    });
  }

  async markFailed(eventId: string, err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await this.prisma.stripeWebhookEvent.update({
        where: { eventId },
        data: {
          lastError: message.slice(0, 1000),
          status: StripeWebhookProcessingStatus.FAILED,
        },
      });
    } catch (updateErr) {
      this.logger.warn(
        `stripe-webhook-mark-failed-db-error eventId=${eventId} reason=${updateErr instanceof Error ? updateErr.message : String(updateErr)}`,
      );
    }
  }
}
