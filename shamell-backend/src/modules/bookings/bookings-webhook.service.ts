import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingPaymentStage,
  BookingPaymentStatus,
  BookingStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { emailBrandingFromConfig } from '../mail/email-html-branding';
import { MailService } from '../mail/mail.service';
import { AdminPaymentNotifyService } from '../mail/admin-payment-notify.service';
import {
  assertCheckoutPaidAmounts,
} from '../stripe/stripe-tax.util';
import { StripeService } from '../stripe/stripe.service';
import { BookingsAdminService } from './bookings-admin.service';
import { adminListInclude } from './booking-includes';
import {
  buildBookingDepositPaidHtml,
  buildBookingDepositPaidSubject,
  buildBookingDepositPaidText,
  buildBookingFullyPaidHtml,
  buildBookingFullyPaidSubject,
  buildBookingFullyPaidText,
} from './booking-quote.mail';

export type StripeCheckoutSessionLite = {
  id?: string;
  metadata?: Record<string, string | undefined>;
  payment_status?: string | null;
  amount_total?: number | null;
  amount_subtotal?: number | null;
  currency?: string | null;
  payment_intent?: string | { id?: string } | null;
};

@Injectable()
export class BookingsWebhookService {
  private readonly logger = new Logger(BookingsWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
    private readonly config: ConfigService,
    private readonly stripeService: StripeService,
    private readonly admin: BookingsAdminService,
  ) {}

  private emailBrandingForTemplates() {
    return emailBrandingFromConfig(this.config);
  }

  async handleBookingPaymentsWebhook(
    rawBody: Buffer,
    signature: string | string[] | undefined,
  ) {
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing stripe-signature header.');
    }
    const event = this.stripeService.client.webhooks.constructEvent(
      rawBody,
      signature,
      this.stripeService.webhookSecret,
    );
    return this.processStripeWebhookEvent(event);
  }

  async processStripeWebhookEvent(event: {
    id: string;
    type: string;
    data: { object: unknown };
  }): Promise<{ received: true; handled: boolean }> {
    const eventObj = this.parseStripeCheckoutSession(event.data.object);
    if (eventObj.metadata?.flow !== 'booking_quote') {
      return { received: true, handled: false };
    }
    if (event.type === 'checkout.session.completed') {
      await this.markBookingPaymentPaid(event.id, eventObj);
      return { received: true, handled: true };
    }
    if (event.type === 'checkout.session.expired') {
      const sessionId = eventObj.id?.trim();
      if (!sessionId) {
        throw new BadRequestException(
          'Invalid checkout.session.expired payload.',
        );
      }
      await this.markBookingPaymentExpired(sessionId);
      return { received: true, handled: true };
    }
    return { received: true, handled: false };
  }

  async markBookingPaymentPaid(
    stripeEventId: string,
    session: StripeCheckoutSessionLite,
  ): Promise<void> {
    const sessionId = session.id;
    if (!sessionId) throw new BadRequestException('Missing session id.');
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        booking: {
          include: {
            user: true,
            eventType: true,
            service: { include: { serviceType: true } },
            event: { include: { eventType: true } },
          },
        },
        quote: true,
      },
    });
    if (!payment) throw new NotFoundException('Booking payment not found.');
    if (payment.status === BookingPaymentStatus.PAID) return;
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Session payment_status is not paid.');
    }
    assertCheckoutPaidAmounts(session, {
      expectedSubtotalCents: Math.round(Number(payment.expectedAmount) * 100),
      expectedCurrency: payment.currency,
      sessionLabel: sessionId,
    });
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
    const paidAt = new Date();
    await this.prisma.bookingPayment.update({
      where: { id: payment.id },
      data: {
        status: BookingPaymentStatus.PAID,
        paidAt,
        stripePaymentIntentId: paymentIntentId,
      },
    });
    if (payment.stage === BookingPaymentStage.DEPOSIT) {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          depositPaidAt: paidAt,
          status: BookingStatus.PENDING,
        },
      });
      if (!payment.customerEmailSentAt) {
        await this.sendDepositPaidEmail(
          payment.bookingId,
          Number(payment.expectedAmount),
        );
        await this.prisma.bookingPayment.update({
          where: { id: payment.id },
          data: { customerEmailSentAt: new Date() },
        });
      }
      await this.adminPaymentNotify.notifyPaymentOutcome({
        outcome: 'DEPOSIT_PAID',
        flow: 'BOOKING_QUOTE',
        customerName:
          payment.booking.user?.fullName ??
          payment.booking.guestFullName ??
          'Client',
        customerEmail:
          payment.booking.user?.email ?? payment.booking.guestEmail ?? '',
        amount: Number(payment.expectedAmount),
        currency: payment.currency,
        contextLabel: this.admin.bookingContextLabel(payment.booking),
        reference: payment.bookingId.slice(0, 8).toUpperCase(),
        stage: payment.stage,
      });
    } else {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          ...(payment.stage === BookingPaymentStage.FULL
            ? { totalAmount: payment.expectedAmount }
            : {
                balancePaidAt: paidAt,
                totalAmount: payment.quote.totalAmount,
              }),
        },
      });
      if (!payment.customerEmailSentAt) {
        await this.sendFullyPaidEmail(
          payment.bookingId,
          Number(payment.expectedAmount),
        );
        await this.prisma.bookingPayment.update({
          where: { id: payment.id },
          data: { customerEmailSentAt: new Date() },
        });
      }
      await this.adminPaymentNotify.notifyPaymentOutcome({
        outcome: 'PAID',
        flow: 'BOOKING_QUOTE',
        customerName:
          payment.booking.user?.fullName ??
          payment.booking.guestFullName ??
          'Client',
        customerEmail:
          payment.booking.user?.email ?? payment.booking.guestEmail ?? '',
        amount: Number(payment.expectedAmount),
        currency: payment.currency,
        contextLabel: this.admin.bookingContextLabel(payment.booking),
        reference: payment.bookingId.slice(0, 8).toUpperCase(),
        stage: payment.stage,
      });
    }
    this.logger.log(
      `booking-payment-paid bookingId=${payment.bookingId} paymentId=${payment.id} stage=${payment.stage} eventId=${stripeEventId}`,
    );
  }

  private async markBookingPaymentExpired(sessionId: string): Promise<void> {
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        booking: {
          include: {
            user: true,
            eventType: true,
            service: { include: { serviceType: true } },
            event: { include: { eventType: true } },
          },
        },
      },
    });
    if (!payment || payment.status !== BookingPaymentStatus.PENDING) return;
    await this.prisma.bookingPayment.update({
      where: { id: payment.id },
      data: { status: BookingPaymentStatus.EXPIRED },
    });
    const booking = payment.booking;
    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'EXPIRED',
      flow: 'BOOKING_QUOTE',
      customerName: booking.user?.fullName ?? booking.guestFullName ?? 'Client',
      customerEmail: booking.user?.email ?? booking.guestEmail ?? '',
      amount: Number(payment.expectedAmount),
      currency: payment.currency,
      contextLabel: this.admin.bookingContextLabel(booking),
      reference: booking.id.slice(0, 8).toUpperCase(),
      stage: payment.stage,
    });
  }

  private async sendDepositPaidEmail(
    bookingId: string,
    amount: number,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: adminListInclude,
    });
    if (!booking) return;
    const toEmail =
      booking.user?.email?.trim().toLowerCase() ??
      booking.guestEmail?.trim().toLowerCase();
    if (!toEmail) return;
    const appPublicName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
    const branding = this.emailBrandingForTemplates();
    const frontendBaseUrl = branding.siteBaseUrl;
    const bookingRef = booking.id.slice(0, 8).toUpperCase();
    const recipientName =
      booking.user?.fullName ?? booking.guestFullName ?? 'Client';
    await this.mail.sendTransactional({
      to: toEmail,
      toName: recipientName,
      subject: buildBookingDepositPaidSubject(appPublicName),
      html: buildBookingDepositPaidHtml({
        recipientName,
        appPublicName,
        frontendBaseUrl,
        branding,
        bookingReference: bookingRef,
        amountUsd: this.usd(amount),
        eventDateLabel: this.admin.bookingEventDateLabel(booking),
      }),
      text: buildBookingDepositPaidText({
        appPublicName,
        recipientName,
        bookingReference: bookingRef,
        amountUsd: this.usd(amount),
        eventDateLabel: this.admin.bookingEventDateLabel(booking),
      }),
    });
  }

  private async sendFullyPaidEmail(
    bookingId: string,
    amount: number,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: adminListInclude,
    });
    if (!booking) return;
    const toEmail =
      booking.user?.email?.trim().toLowerCase() ??
      booking.guestEmail?.trim().toLowerCase();
    if (!toEmail) return;
    const appPublicName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
    const branding = this.emailBrandingForTemplates();
    const frontendBaseUrl = branding.siteBaseUrl;
    const bookingRef = booking.id.slice(0, 8).toUpperCase();
    const recipientName =
      booking.user?.fullName ?? booking.guestFullName ?? 'Client';
    await this.mail.sendTransactional({
      to: toEmail,
      toName: recipientName,
      subject: buildBookingFullyPaidSubject(appPublicName),
      html: buildBookingFullyPaidHtml({
        recipientName,
        appPublicName,
        frontendBaseUrl,
        branding,
        bookingReference: bookingRef,
        amountUsd: this.usd(amount),
        eventDateLabel: this.admin.bookingEventDateLabel(booking),
      }),
      text: buildBookingFullyPaidText({
        appPublicName,
        recipientName,
        bookingReference: bookingRef,
        amountUsd: this.usd(amount),
        eventDateLabel: this.admin.bookingEventDateLabel(booking),
      }),
    });
  }

  parseStripeCheckoutSession(raw: unknown): StripeCheckoutSessionLite {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('Invalid Stripe checkout session payload.');
    }
    return raw;
  }

  private usd(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
