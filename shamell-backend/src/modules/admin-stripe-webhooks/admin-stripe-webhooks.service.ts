import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StripeWebhookProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminStripeWebhookEventDetail,
  AdminStripeWebhookEventRow,
  AdminStripeWebhookRelatedPayment,
} from './admin-stripe-webhooks.types';
import type { AdminStripeWebhookEventsQueryDto } from './dto/admin-stripe-webhook-events-query.dto';

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toRow(row: {
  id: string;
  eventId: string;
  eventType: string;
  livemode: boolean;
  status: StripeWebhookProcessingStatus;
  metadataFlow: string | null;
  checkoutSessionId: string | null;
  handler: string | null;
  payloadSummary: Prisma.JsonValue;
  processedAt: Date | null;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminStripeWebhookEventRow {
  return {
    id: row.id,
    eventId: row.eventId,
    eventType: row.eventType,
    livemode: row.livemode,
    status: row.status,
    metadataFlow: row.metadataFlow,
    checkoutSessionId: row.checkoutSessionId,
    handler: row.handler,
    payloadSummary:
      row.payloadSummary && typeof row.payloadSummary === 'object'
        ? (row.payloadSummary as Record<string, unknown>)
        : null,
    processedAt: iso(row.processedAt),
    attempts: row.attempts,
    lastError: row.lastError,
    createdAt: iso(row.createdAt) ?? '',
    updatedAt: iso(row.updatedAt) ?? '',
  };
}

@Injectable()
export class AdminStripeWebhooksService {
  constructor(private readonly prisma: PrismaService) {}

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
      this.prisma.stripeWebhookEvent.count({ where }),
      this.prisma.stripeWebhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    return {
      items: rows.map(toRow),
      meta: {
        page,
        perPage: limit,
        totalItems,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  async getEventByStripeId(
    eventId: string,
  ): Promise<AdminStripeWebhookEventDetail> {
    const row = await this.prisma.stripeWebhookEvent.findUnique({
      where: { eventId },
    });
    if (!row) {
      throw new NotFoundException(`Stripe webhook event ${eventId} not found.`);
    }
    const relatedPayments = await this.resolveRelatedPayments(
      row.checkoutSessionId,
    );
    return {
      ...toRow(row),
      relatedPayments,
    };
  }

  private async resolveRelatedPayments(
    checkoutSessionId: string | null,
  ): Promise<AdminStripeWebhookRelatedPayment[]> {
    if (!checkoutSessionId?.trim()) return [];
    const sessionId = checkoutSessionId.trim();
    const results: AdminStripeWebhookRelatedPayment[] = [];

    const [
      bookingPayment,
      classEnrollment,
      packageEnrollment,
      fixedEnrollment,
      venueReservation,
    ] = await Promise.all([
      this.prisma.bookingPayment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        select: {
          id: true,
          status: true,
          expectedAmount: true,
          currency: true,
          paidAt: true,
          booking: { select: { user: { select: { email: true } } } },
        },
      }),
      this.prisma.upcomingClassEnrollment.findFirst({
        where: { stripeCheckoutSessionId: sessionId },
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          paidAt: true,
          customerEmail: true,
        },
      }),
      this.prisma.upcomingClassPackageEnrollment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          paidAt: true,
          customerEmail: true,
        },
      }),
      this.prisma.upcomingFixedEventEnrollment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          paidAt: true,
          customerEmail: true,
        },
      }),
      this.prisma.venueSeatReservation.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          paidAt: true,
          customerEmail: true,
        },
      }),
    ]);

    if (bookingPayment) {
      results.push({
        kind: 'booking_payment',
        id: bookingPayment.id,
        status: bookingPayment.status,
        customerEmail: bookingPayment.booking.user?.email ?? null,
        amount: bookingPayment.expectedAmount.toString(),
        currency: bookingPayment.currency,
        paidAt: iso(bookingPayment.paidAt),
      });
    }
    if (classEnrollment) {
      results.push({
        kind: 'class_enrollment',
        id: classEnrollment.id,
        status: classEnrollment.status,
        customerEmail: classEnrollment.customerEmail,
        amount: classEnrollment.amount.toString(),
        currency: classEnrollment.currency,
        paidAt: iso(classEnrollment.paidAt),
      });
    }
    if (packageEnrollment) {
      results.push({
        kind: 'class_package_enrollment',
        id: packageEnrollment.id,
        status: packageEnrollment.status,
        customerEmail: packageEnrollment.customerEmail,
        amount: packageEnrollment.amount.toString(),
        currency: packageEnrollment.currency,
        paidAt: iso(packageEnrollment.paidAt),
      });
    }
    if (fixedEnrollment) {
      results.push({
        kind: 'fixed_event_enrollment',
        id: fixedEnrollment.id,
        status: fixedEnrollment.status,
        customerEmail: fixedEnrollment.customerEmail,
        amount: fixedEnrollment.amount.toString(),
        currency: fixedEnrollment.currency,
        paidAt: iso(fixedEnrollment.paidAt),
      });
    }
    if (venueReservation) {
      results.push({
        kind: 'venue_seat_reservation',
        id: venueReservation.id,
        status: venueReservation.status,
        customerEmail: venueReservation.customerEmail,
        amount: venueReservation.amount.toString(),
        currency: venueReservation.currency,
        paidAt: iso(venueReservation.paidAt),
      });
    }

    return results;
  }
}
