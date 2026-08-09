import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  bookingPaymentRelatedSelect,
  classEnrollmentRelatedSelect,
  fixedEnrollmentRelatedSelect,
  packageEnrollmentRelatedSelect,
  venueReservationRelatedSelect,
} from '../constants/admin-stripe-webhooks.constants';
import {
  emptyRelatedPaymentSources,
  type RelatedPaymentSources,
  type StripeWebhookEventPrismaRow,
} from '../utils/admin-stripe-webhooks-mapper.util';

@Injectable()
export class AdminStripeWebhooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  countEvents(where: Prisma.StripeWebhookEventWhereInput): Promise<number> {
    return this.prisma.stripeWebhookEvent.count({ where });
  }

  findEventsPage(
    where: Prisma.StripeWebhookEventWhereInput,
    skip: number,
    take: number,
  ): Promise<StripeWebhookEventPrismaRow[]> {
    return this.prisma.stripeWebhookEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  findByStripeEventId(
    eventId: string,
  ): Promise<StripeWebhookEventPrismaRow | null> {
    return this.prisma.stripeWebhookEvent.findUnique({
      where: { eventId },
    });
  }

  async findRelatedPaymentSources(
    checkoutSessionId: string | null,
  ): Promise<RelatedPaymentSources> {
    if (!checkoutSessionId?.trim()) {
      return emptyRelatedPaymentSources();
    }
    const sessionId = checkoutSessionId.trim();

    const [
      bookingPayment,
      classEnrollment,
      packageEnrollment,
      fixedEnrollment,
      venueReservation,
    ] = await Promise.all([
      this.prisma.bookingPayment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        select: bookingPaymentRelatedSelect,
      }),
      this.prisma.upcomingClassEnrollment.findFirst({
        where: { stripeCheckoutSessionId: sessionId },
        select: classEnrollmentRelatedSelect,
      }),
      this.prisma.upcomingClassPackageEnrollment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        select: packageEnrollmentRelatedSelect,
      }),
      this.prisma.upcomingFixedEventEnrollment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        select: fixedEnrollmentRelatedSelect,
      }),
      this.prisma.venueSeatReservation.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        select: venueReservationRelatedSelect,
      }),
    ]);

    return {
      bookingPayment,
      classEnrollment,
      packageEnrollment,
      fixedEnrollment,
      venueReservation,
    };
  }
}
