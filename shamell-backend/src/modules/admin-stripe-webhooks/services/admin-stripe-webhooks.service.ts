import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginationMeta } from '../../../common/pagination/pagination.util';
import type { AdminStripeWebhookEventDetail } from '../types/admin-stripe-webhooks.types';
import type { AdminStripeWebhookEventsQueryDto } from '../dto/admin-stripe-webhook-events-query.dto';
import {
  mapRelatedPaymentsFromSources,
  toDetailRow,
  toRow,
} from '../utils/admin-stripe-webhooks-mapper.util';
import { AdminStripeWebhooksRepository } from './admin-stripe-webhooks.repository';

@Injectable()
export class AdminStripeWebhooksService {
  constructor(private readonly repository: AdminStripeWebhooksRepository) {}

  async listEvents(query: AdminStripeWebhookEventsQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from && Number.isNaN(from.getTime())) {
      throw new BadRequestException('Invalid from date.');
    }
    if (to && Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid to date.');
    }

    const where: Prisma.StripeWebhookEventWhereInput = {};
    if (query.eventType?.trim()) {
      where.eventType = query.eventType.trim();
    }
    if (query.metadataFlow?.trim()) {
      where.metadataFlow = query.metadataFlow.trim();
    }
    if (query.checkoutSessionId?.trim()) {
      where.checkoutSessionId = query.checkoutSessionId.trim();
    }
    if (query.purchaseCorrelationId?.trim()) {
      where.purchaseCorrelationId = query.purchaseCorrelationId.trim();
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.processed === true) {
      where.processedAt = { not: null };
    } else if (query.processed === false) {
      where.processedAt = null;
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [totalItems, rows] = await Promise.all([
      this.repository.countEvents(where),
      this.repository.findEventsPage(where, (page - 1) * limit, limit),
    ]);

    return {
      items: rows.map(toRow),
      meta: buildPaginationMeta({ page, perPage: limit, totalItems }),
    };
  }

  async getEventByStripeId(
    eventId: string,
  ): Promise<AdminStripeWebhookEventDetail> {
    const row = await this.repository.findByStripeEventId(eventId);
    if (!row) {
      throw new NotFoundException(`Stripe webhook event ${eventId} not found.`);
    }
    const sources = await this.repository.findRelatedPaymentSources(
      row.checkoutSessionId,
    );
    return {
      ...toDetailRow(row),
      relatedPayments: mapRelatedPaymentsFromSources(sources),
    };
  }
}
