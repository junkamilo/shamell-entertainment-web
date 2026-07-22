import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  EventPublicSection,
  Prisma,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
  VenueReservationPaymentChannel,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AdminPaymentNotifyService } from '../mail/admin-payment-notify.service';
import { emailBrandingFromProcessEnv } from '../mail/email-html-branding';
import {
  buildClassPaymentRequestHtml,
  buildClassPaymentRequestSubject,
  buildClassPaymentRequestText,
} from './class-payment-request.mail';
import {
  buildFixedTicketConfirmationHtml,
  buildFixedTicketConfirmationSubject,
  buildFixedTicketConfirmationText,
} from './fixed-ticket-confirmation.mail';
import {
  stripeAutomaticTaxParams,
  stripeTaxProductData,
} from '../stripe/stripe-tax.util';
import { StripeService } from '../stripe/stripe.service';
import { resolveUpcomingPurchaseContext } from './upcoming-purchase-mode.util';
import {
  assignFixedEventTicketNumber,
  fixedTicketsRemaining,
} from './upcoming-fixed-ticket.util';
import type { CreateAdminFixedEventEnrollmentDto } from './dto/create-admin-fixed-event-enrollment.dto';

const CHECKOUT_TTL_MINUTES = 30;

@Injectable()
export class AdminFixedEventEnrollmentService {
  private readonly logger = new Logger(AdminFixedEventEnrollmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly mail: MailService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
  ) {}

  async listBoxOfficeFixedEvents() {
    const events = await this.prisma.event.findMany({
      where: {
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        isActive: true,
        OR: [
          { experienceType: UpcomingExperienceType.VENUE_SEATING },
          {
            venueConfig: {
              is: {
                clientEnabled: false,
                reservationEventTemplate: {
                  is: { scheduleMode: ReservationEventScheduleMode.FIXED_EVENT },
                },
              },
            },
          },
        ],
      },
      include: {
        eventType: true,
        venueConfig: {
          include: { reservationEventTemplate: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const out: Array<{
      id: string;
      name: string;
      slug: string | null;
      purchaseKind: 'venue_seating' | 'fixed_ticket';
      price: number | null;
      currency: string;
      ticketsRemaining: number | null;
      fixedTicketCapacity: number | null;
      floorLayoutId: string | null;
      eventDateIso: string | null;
      eventLabel: string | null;
    }> = [];

    for (const event of events) {
      const vc = event.venueConfig;
      const templateMode = vc?.reservationEventTemplate?.scheduleMode ?? null;
      const price = event.price != null ? Number(event.price) : null;
      const capacity = vc?.fixedTicketCapacity ?? null;
      const ticketsRemaining =
        capacity != null && capacity >= 1
          ? await fixedTicketsRemaining(this.prisma, event.id, capacity)
          : null;

      const ctx = resolveUpcomingPurchaseContext({
        experienceType: event.experienceType,
        price,
        clientEnabled: vc?.clientEnabled ?? false,
        templateScheduleMode: templateMode,
        reservationOpensAt: vc?.reservationOpensAt ?? null,
        reservationClosesAt: vc?.reservationClosesAt ?? null,
        reservationEventDate: vc?.reservationEventDate ?? null,
        reservationTimezone: vc?.reservationTimezone,
        fixedTicketCapacity: capacity,
        ticketsRemaining: ticketsRemaining ?? undefined,
      });

      let purchaseKind: 'venue_seating' | 'fixed_ticket' | null = null;
      if (
        event.experienceType === UpcomingExperienceType.VENUE_SEATING &&
        (ctx.purchaseMode === 'venue_seating' || vc?.clientEnabled)
      ) {
        purchaseKind = 'venue_seating';
      } else if (ctx.purchaseMode === 'fixed_ticket') {
        purchaseKind = 'fixed_ticket';
      } else if (
        templateMode === ReservationEventScheduleMode.FIXED_EVENT &&
        !vc?.clientEnabled
      ) {
        purchaseKind = 'fixed_ticket';
      }

      if (!purchaseKind) continue;
      if (!event.slug?.trim() && purchaseKind === 'venue_seating') {
        // still list by id for admin
      }

      out.push({
        id: event.id,
        name: event.eventType.name.trim(),
        slug: event.slug,
        purchaseKind,
        price,
        currency: 'usd',
        ticketsRemaining,
        fixedTicketCapacity: capacity,
        floorLayoutId: vc?.floorLayoutId ?? null,
        eventDateIso: vc?.reservationEventDate?.toISOString() ?? null,
        eventLabel: vc?.reservationEventLabel ?? null,
      });
    }

    return { events: out };
  }

  async createAdminCash(
    adminUserId: string,
    dto: CreateAdminFixedEventEnrollmentDto,
  ) {
    const { event, venueConfig, amount } =
      await this.assertAdminFixedTicketEvent(dto.upcomingEventId);
    const customer = this.normalizeCustomer(dto);
    const capacity = venueConfig.fixedTicketCapacity!;

    const remaining = await fixedTicketsRemaining(
      this.prisma,
      event.id,
      capacity,
    );
    if (remaining <= 0) {
      throw new ConflictException('Tickets sold out.');
    }

    const now = new Date();
    const enrollment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.upcomingFixedEventEnrollment.create({
        data: {
          eventId: event.id,
          amount,
          currency: 'usd',
          status: UpcomingClassEnrollmentStatus.PAID,
          paymentChannel: VenueReservationPaymentChannel.CASH,
          stripeCheckoutSessionId: null,
          paymentMethodType: 'cash',
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          customerPhone: customer.customerPhone,
          boxOfficeDetails: dto.boxOfficeDetails as Prisma.InputJsonValue,
          createdByAdminId: adminUserId,
          paidAt: now,
        },
        include: { event: { include: { eventType: true } } },
      });
      await assignFixedEventTicketNumber(tx, event.id, created.id, capacity);
      return tx.upcomingFixedEventEnrollment.findUniqueOrThrow({
        where: { id: created.id },
        include: { event: { include: { eventType: true } } },
      });
    });

    const sent = await this.sendPaidConfirmation(enrollment, venueConfig);
    if (sent) {
      await this.prisma.upcomingFixedEventEnrollment.update({
        where: { id: enrollment.id },
        data: { customerEmailSentAt: now },
      });
    }

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',
      flow: 'FIXED_TICKET',
      customerName: enrollment.customerName,
      customerEmail: enrollment.customerEmail,
      amount: Number(enrollment.amount),
      currency: enrollment.currency,
      contextLabel: `${enrollment.event.eventType.name} — ticket #${enrollment.ticketNumber}`,
      reference: enrollment.id.slice(0, 8).toUpperCase(),
    });

    this.logger.log(
      `admin-fixed-ticket-cash enrollmentId=${enrollment.id} admin=${adminUserId}`,
    );

    return {
      enrollmentId: enrollment.id,
      ticketNumber: enrollment.ticketNumber,
      message: 'Ticket reserved.',
    };
  }

  async createAdminCheckoutSession(
    adminUserId: string,
    dto: CreateAdminFixedEventEnrollmentDto,
  ) {
    const { event, venueConfig, amount } =
      await this.assertAdminFixedTicketEvent(dto.upcomingEventId);
    const customer = this.normalizeCustomer(dto);
    const capacity = venueConfig.fixedTicketCapacity!;

    const remaining = await fixedTicketsRemaining(
      this.prisma,
      event.id,
      capacity,
    );
    if (remaining <= 0) {
      throw new ConflictException('Tickets sold out.');
    }

    const amountCents = Math.round(Number(amount) * 100);
    if (amountCents < 50) {
      throw new BadRequestException('Invalid event ticket price.');
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl().replace(/\/$/, '');
    const slug = event.slug?.trim();
    if (!slug) {
      throw new BadRequestException('Event slug is required for payment links.');
    }
    const successUrl = `${frontendUrl}/on-coming-events/${encodeURIComponent(slug)}/return?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/shamell-admin/agenda/box-office`;

    const checkout = await this.stripeService.client.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer.customerEmail,
      ...stripeAutomaticTaxParams(),
      payment_intent_data: {
        receipt_email: customer.customerEmail,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: stripeTaxProductData({
              name: `${event.eventType.name} — ticket`,
              description: venueConfig.reservationEventLabel ?? 'Event ticket',
            }),
          },
        },
      ],
      metadata: {
        flow: 'fixed_event_ticket',
        adminUserId,
        paymentChannel: 'STRIPE',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    if (!checkout.url) {
      throw new BadRequestException('Could not start checkout.');
    }

    const enrollment = await this.prisma.upcomingFixedEventEnrollment.create({
      data: {
        eventId: event.id,
        amount,
        currency: 'usd',
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        paymentChannel: VenueReservationPaymentChannel.STRIPE,
        stripeCheckoutSessionId: checkout.id,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        boxOfficeDetails: dto.boxOfficeDetails as Prisma.InputJsonValue,
        createdByAdminId: adminUserId,
        expiresAt,
      },
    });

    await this.stripeService.client.checkout.sessions.update(checkout.id, {
      metadata: {
        flow: 'fixed_event_ticket',
        enrollmentId: enrollment.id,
        adminUserId,
        paymentChannel: 'STRIPE',
      },
    });

    const payUrl = checkout.url;
    const branding = emailBrandingFromProcessEnv();
    const appPublicName =
      process.env.APP_PUBLIC_NAME?.trim() || 'Shamell Entertainment';
    const amountUsd = `${Number(amount).toFixed(2)} USD`;
    await this.mail.sendTransactional({
      to: customer.customerEmail,
      toName: customer.customerName,
      subject: buildClassPaymentRequestSubject(appPublicName).replace(
        'class payment',
        'ticket payment',
      ),
      text: buildClassPaymentRequestText({
        recipientName: customer.customerName,
        appPublicName,
        frontendBaseUrl: branding.siteBaseUrl,
        branding,
        enrollmentReference: enrollment.id.slice(0, 8).toUpperCase(),
        eventLabel: event.eventType.name,
        classLabel: 'Event ticket',
        amountUsd,
        payUrl,
      }),
      html: buildClassPaymentRequestHtml({
        recipientName: customer.customerName,
        appPublicName,
        frontendBaseUrl: branding.siteBaseUrl,
        branding,
        enrollmentReference: enrollment.id.slice(0, 8).toUpperCase(),
        eventLabel: event.eventType.name,
        classLabel: 'Event ticket',
        amountUsd,
        payUrl,
      }),
    });

    this.logger.log(
      `admin-fixed-ticket-checkout enrollmentId=${enrollment.id} session=${checkout.id} admin=${adminUserId}`,
    );

    return {
      enrollmentId: enrollment.id,
      message: 'Payment link sent to customer.',
      payUrl,
    };
  }

  private normalizeCustomer(dto: CreateAdminFixedEventEnrollmentDto) {
    return {
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone?.trim() || null,
    };
  }

  private async assertAdminFixedTicketEvent(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        isActive: true,
      },
      include: {
        eventType: true,
        venueConfig: {
          include: { reservationEventTemplate: true },
        },
      },
    });
    if (!event) throw new NotFoundException('Upcoming event not found.');
    const venueConfig = event.venueConfig;
    if (
      !venueConfig?.reservationEventTemplate ||
      venueConfig.reservationEventTemplate.scheduleMode !==
        ReservationEventScheduleMode.FIXED_EVENT ||
      venueConfig.clientEnabled
    ) {
      throw new BadRequestException('This event does not offer fixed tickets.');
    }
    const capacity = venueConfig.fixedTicketCapacity;
    if (capacity == null || capacity < 1) {
      throw new BadRequestException(
        'Ticket capacity is not configured for this event.',
      );
    }
    if (event.price == null || Number(event.price) < 0.5) {
      throw new BadRequestException('Invalid event ticket price.');
    }
    return { event, venueConfig, amount: event.price };
  }

  private async sendPaidConfirmation(
    enrollment: {
      customerName: string;
      customerEmail: string;
      amount: Prisma.Decimal;
      currency: string;
      ticketNumber: number | null;
      event: { eventType: { name: string } };
    },
    venueConfig: {
      reservationEventDate: Date | null;
      reservationEventLabel: string | null;
    },
  ): Promise<boolean> {
    if (enrollment.ticketNumber == null) return false;
    const eventName = enrollment.event.eventType.name;
    const amount = `${Number(enrollment.amount).toFixed(2)} ${enrollment.currency.toUpperCase()}`;
    const eventDateLabel =
      venueConfig.reservationEventLabel?.trim() ||
      (venueConfig.reservationEventDate
        ? venueConfig.reservationEventDate.toISOString()
        : 'See event details');
    const branding = emailBrandingFromProcessEnv();
    const { ok } = await this.mail.sendTransactional({
      to: enrollment.customerEmail,
      toName: enrollment.customerName,
      subject: buildFixedTicketConfirmationSubject(eventName),
      text: buildFixedTicketConfirmationText({
        eventName,
        customerName: enrollment.customerName,
        ticketNumber: enrollment.ticketNumber,
        eventDateLabel,
        amount,
        siteBaseUrl: branding.siteBaseUrl,
      }),
      html: buildFixedTicketConfirmationHtml({
        eventName,
        customerName: enrollment.customerName,
        ticketNumber: enrollment.ticketNumber,
        eventDateLabel,
        amount,
        branding,
      }),
    });
    return ok;
  }
}
